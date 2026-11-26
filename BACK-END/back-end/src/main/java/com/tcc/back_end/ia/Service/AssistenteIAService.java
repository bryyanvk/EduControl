package com.tcc.back_end.ia.Service;

import com.tcc.back_end.DTO.TeamResponseDTO;
import com.tcc.back_end.Service.TeamService;
import com.tcc.back_end.ia.DTO.AcaoIADTO;
import com.tcc.back_end.ia.DTO.RespostaIAResponse;
import com.tcc.back_end.ia.Model.AcaoPendente;
import com.tcc.back_end.ia.Model.UsuarioIA;
import com.tcc.back_end.ia.Service.RoteadorIntencaoService.Intencao;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * Orquestra o assistente: o roteador decide; consultas e alterações vão para
 * os services reais; o que sobrar vai para o Gemini (conversa livre).
 *
 * Alterações seguem dois passos: /perguntar PROPÕE (acaoPendente) e só
 * /acoes/{id}/confirmar (ou "sim" no chat) EXECUTA.
 */
@Service
public class AssistenteIAService {

    private final RoteadorIntencaoService roteador;
    private final FerramentasIAService ferramentas;
    private final AcaoPendenteService acoesPendentes;
    private final GeminiService geminiService;
    private final TeamService teamService;
    private final ConhecimentoSistemaService conhecimento;

    public AssistenteIAService(
            RoteadorIntencaoService roteador,
            FerramentasIAService ferramentas,
            AcaoPendenteService acoesPendentes,
            GeminiService geminiService,
            TeamService teamService,
            ConhecimentoSistemaService conhecimento) {

        this.roteador = roteador;
        this.ferramentas = ferramentas;
        this.acoesPendentes = acoesPendentes;
        this.geminiService = geminiService;
        this.teamService = teamService;
        this.conhecimento = conhecimento;
    }

    public RespostaIAResponse perguntar(String pergunta) {

        UsuarioIA usuario = usuarioAtual();

        boolean haPendente = acoesPendentes.doUsuario(usuario.matricula()).isPresent();

        Intencao intencao = roteador.interpretar(pergunta, haPendente);

        switch (intencao.tipo()) {

            case CONFIRMAR -> {
                AcaoPendente acao = acoesPendentes.doUsuario(usuario.matricula())
                        .orElseThrow();
                return confirmar(acao.id());
            }

            case CANCELAR -> {
                AcaoPendente acao = acoesPendentes.doUsuario(usuario.matricula())
                        .orElseThrow();
                return cancelar(acao.id());
            }

            case CONTAR_DADOS -> {
                return new RespostaIAResponse(
                        ferramentas.contarDados(intencao.categorias()));
            }

            case PRESENCA_HOJE -> {
                return new RespostaIAResponse(ferramentas.presencaHoje());
            }

            case CONHECIMENTO -> {
                String chave = "AJUDA".equals(intencao.valor())
                        ? "AJUDA_" + usuario.tipoAcesso().name()
                        : intencao.valor();

                String texto = conhecimento.secao(chave);

                return texto != null
                        ? new RespostaIAResponse(texto)
                        : new RespostaIAResponse(responderComGemini(
                        pergunta, usuario));
            }

            case TELEFONE -> {
                return new RespostaIAResponse(ferramentas.telefoneDe(
                        usuario, intencao.nome(), "PROPRIO".equals(intencao.valor())));
            }

            case CONSULTAR_APARENCIA -> {
                return new RespostaIAResponse(ferramentas.consultarAparencia());
            }

            case ALTERAR_APARENCIA -> {
                return propor(usuario,
                        ferramentas.proporAparencia(usuario, intencao.valor()));
            }

            case ALTERAR_NOTIFICACAO -> {
                return propor(usuario, ferramentas.proporNotificacao(
                        usuario, intencao.campo(), intencao.ligar()));
            }

            default -> {
                return new RespostaIAResponse(responderComGemini(pergunta, usuario));
            }
        }
    }

    public RespostaIAResponse confirmar(String id) {

        UsuarioIA usuario = usuarioAtual();

        AcaoPendente acao = acoesPendentes.consumir(id, usuario.matricula())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ação não encontrada, já utilizada ou expirada."));

        String mensagem;

        try {
            mensagem = ferramentas.executar(usuario, acao);
        } catch (SecurityException erro) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Seu perfil não tem permissão para esta alteração.");
        } catch (IllegalStateException erro) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não foi possível aplicar a alteração: " + erro.getMessage());
        }

        return new RespostaIAResponse(mensagem, null, paraDTO(acao, false));
    }

    public RespostaIAResponse cancelar(String id) {

        UsuarioIA usuario = usuarioAtual();

        acoesPendentes.consumir(id, usuario.matricula())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ação não encontrada, já utilizada ou expirada."));

        return new RespostaIAResponse(
                "Tudo bem, não alterei nada no sistema.");
    }

    public String gerarResumoDiario() {
        return geminiService.gerarResumoDiario();
    }

    private RespostaIAResponse propor(
            UsuarioIA usuario, FerramentasIAService.Proposta proposta) {

        if (!proposta.valida()) {
            return new RespostaIAResponse(proposta.mensagem());
        }

        AcaoPendente acao = acoesPendentes.criar(
                usuario.matricula(), proposta.tipo(),
                proposta.descricao(), proposta.parametros());

        return new RespostaIAResponse(
                proposta.descricao() + " Ainda não alterei nada: confirma?",
                paraDTO(acao, true), null);
    }

    private String responderComGemini(String pergunta, UsuarioIA usuario) {
        try {
            return geminiService.gerarResposta(pergunta,
                    usuario.tipoAcesso().name());
        } catch (RuntimeException erro) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "O assistente de IA está indisponível no momento. "
                            + "Verifique a chave GEMINI_API_KEY e tente novamente.");
        }
    }

    private AcaoIADTO paraDTO(AcaoPendente acao, boolean comExpiracao) {
        return new AcaoIADTO(
                acao.id(),
                acao.tipo().name(),
                acao.descricao(),
                acao.parametros(),
                comExpiracao ? acao.expiraEm().toString() : null);
    }

    /** Usuário do Basic Auth atual (SecurityContext), com os dados reais da equipe. */
    UsuarioIA usuarioAtual() {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()
                || auth.getName() == null
                || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Faça login para usar o assistente.");
        }

        TeamResponseDTO membro = teamService.buscarTeamPorMatricula(auth.getName());

        if (membro == null || membro.getTipoAcesso() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Usuário não encontrado.");
        }

        return new UsuarioIA(membro.getId(), membro.getMatricula(),
                membro.getNome(), membro.getTipoAcesso());
    }
}
