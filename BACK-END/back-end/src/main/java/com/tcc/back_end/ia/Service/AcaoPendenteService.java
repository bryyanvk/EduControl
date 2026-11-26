package com.tcc.back_end.ia.Service;

import com.tcc.back_end.ia.Model.AcaoPendente;
import com.tcc.back_end.ia.Model.TipoAcaoIA;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Guarda em memória as ações propostas pela IA até o usuário confirmar.
 * Cada usuário tem no máximo uma ação pendente; ela vale uma única vez,
 * só pode ser usada por quem a pediu e expira sozinha.
 */
@Service
public class AcaoPendenteService {

    private final Map<String, AcaoPendente> porId = new ConcurrentHashMap<>();
    private final Clock relogio;
    private final long validadeSegundos;

    @Autowired
    public AcaoPendenteService(
            @Value("${educontrol.ia.acao-validade-segundos:300}")
            long validadeSegundos) {
        this(Clock.systemUTC(), validadeSegundos);
    }

    public AcaoPendenteService(Clock relogio, long validadeSegundos) {
        this.relogio = relogio;
        this.validadeSegundos = validadeSegundos;
    }

    public synchronized AcaoPendente criar(
            String matriculaUsuario,
            TipoAcaoIA tipo,
            String descricao,
            Map<String, Object> parametros) {

        limparExpiradas();

        // Uma ação nova substitui a anterior do mesmo usuário.
        porId.values().removeIf(a -> a.matriculaUsuario().equals(matriculaUsuario));

        AcaoPendente acao = new AcaoPendente(
                UUID.randomUUID().toString(),
                matriculaUsuario,
                tipo,
                descricao,
                Map.copyOf(parametros),
                relogio.instant().plusSeconds(validadeSegundos)
        );

        porId.put(acao.id(), acao);

        return acao;
    }

    public synchronized Optional<AcaoPendente> doUsuario(String matriculaUsuario) {
        limparExpiradas();

        return porId.values().stream()
                .filter(a -> a.matriculaUsuario().equals(matriculaUsuario))
                .findFirst();
    }

    /** Retira a ação (uso único). Vazio se não existe, expirou ou é de outro usuário. */
    public synchronized Optional<AcaoPendente> consumir(
            String id, String matriculaUsuario) {

        limparExpiradas();

        AcaoPendente acao = id == null ? null : porId.get(id);

        if (acao == null || !acao.matriculaUsuario().equals(matriculaUsuario)) {
            return Optional.empty();
        }

        porId.remove(id);

        return Optional.of(acao);
    }

    private void limparExpiradas() {
        Instant agora = relogio.instant();
        porId.values().removeIf(a -> !a.expiraEm().isAfter(agora));
    }
}
