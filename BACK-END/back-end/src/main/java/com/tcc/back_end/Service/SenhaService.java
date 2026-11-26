package com.tcc.back_end.Service;

import com.tcc.back_end.Model.Team;
import com.tcc.back_end.Repository.TeamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Recuperação de senha por código enviado por e-mail.
 *
 * - O código tem 6 dígitos, vale 15 minutos e só pode ser usado uma vez.
 * - Só o hash do código fica guardado.
 * - No máximo 5 tentativas erradas por código e 3 pedidos a cada 15 minutos por e-mail.
 * - A resposta de "esqueci" é sempre a mesma, exista o e-mail ou não.
 */
@Service
public class SenhaService {

    static final int VALIDADE_MINUTOS = 15;
    static final int MAX_TENTATIVAS = 5;
    static final int MAX_PEDIDOS = 3;
    static final int TAMANHO_MINIMO_SENHA = 8;

    private static final String MENSAGEM_PEDIDO =
            "Se o e-mail estiver cadastrado, enviaremos um código de verificação.";

    private static final String MENSAGEM_CODIGO_INVALIDO =
            "Código inválido ou expirado. Solicite um novo código.";

    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final NotificacaoService notificacaoService;

    private final SecureRandom random = new SecureRandom();

    private final Map<String, CodigoRecuperacao> codigos = new HashMap<>();
    private final Map<String, List<Instant>> pedidos = new HashMap<>();

    public SenhaService(
            TeamRepository teamRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            NotificacaoService notificacaoService
    ) {
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.notificacaoService = notificacaoService;
    }

    public synchronized String solicitarCodigo(String email) {

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o e-mail."
            );
        }

        String chave = normalizar(email);
        Instant agora = Instant.now();

        limparExpirados(agora);

        Team team = teamRepository.buscarTeamPorEmail(chave);

        if (team == null || !team.isAcessoAtivo()) {
            return MENSAGEM_PEDIDO;
        }

        List<Instant> historico =
                pedidos.computeIfAbsent(chave, k -> new ArrayList<>());

        if (historico.size() >= MAX_PEDIDOS) {
            return MENSAGEM_PEDIDO;
        }

        historico.add(agora);

        String codigo = String.format("%06d", random.nextInt(1_000_000));

        codigos.put(chave, new CodigoRecuperacao(
                passwordEncoder.encode(codigo),
                agora.plus(Duration.ofMinutes(VALIDADE_MINUTOS))
        ));

        emailService.enviarCodigoRecuperacao(
                team.getEmail(),
                team.getNome(),
                codigo,
                VALIDADE_MINUTOS
        );

        return MENSAGEM_PEDIDO;
    }

    public synchronized String redefinirSenha(
            String email,
            String codigo,
            String novaSenha
    ) {

        if (email == null || email.isBlank()
                || codigo == null || codigo.isBlank()
                || novaSenha == null || novaSenha.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o e-mail, o código e a nova senha."
            );
        }

        if (novaSenha.length() < TAMANHO_MINIMO_SENHA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ter pelo menos "
                            + TAMANHO_MINIMO_SENHA + " caracteres."
            );
        }

        if (novaSenha.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ter no máximo 72 caracteres."
            );
        }

        String chave = normalizar(email);
        Instant agora = Instant.now();

        limparExpirados(agora);

        CodigoRecuperacao registro = codigos.get(chave);

        if (registro == null) {
            throw codigoInvalido();
        }

        if (!passwordEncoder.matches(codigo.trim(), registro.hash)) {

            registro.tentativas++;

            if (registro.tentativas >= MAX_TENTATIVAS) {
                codigos.remove(chave);
            }

            throw codigoInvalido();
        }

        Team team = teamRepository.buscarTeamPorEmail(chave);

        if (team == null || !team.isAcessoAtivo()) {
            codigos.remove(chave);
            throw codigoInvalido();
        }

        teamRepository.atualizarSenha(
                team.getId(),
                passwordEncoder.encode(novaSenha)
        );

        codigos.remove(chave);
        pedidos.remove(chave);

        notificacaoService.registrarAlteracaoSenha(team);

        return "Senha redefinida com sucesso.";
    }

    private ResponseStatusException codigoInvalido() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                MENSAGEM_CODIGO_INVALIDO
        );
    }

    private String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void limparExpirados(Instant agora) {

        codigos.values().removeIf(c -> c.expiraEm.isBefore(agora));

        Instant limite = agora.minus(Duration.ofMinutes(VALIDADE_MINUTOS));

        pedidos.values().forEach(
                lista -> lista.removeIf(data -> data.isBefore(limite))
        );

        pedidos.values().removeIf(List::isEmpty);
    }

    private static class CodigoRecuperacao {

        private final String hash;
        private final Instant expiraEm;
        private int tentativas = 0;

        private CodigoRecuperacao(String hash, Instant expiraEm) {
            this.hash = hash;
            this.expiraEm = expiraEm;
        }
    }
}
