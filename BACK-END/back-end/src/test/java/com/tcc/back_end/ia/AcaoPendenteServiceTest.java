package com.tcc.back_end.ia;

import com.tcc.back_end.ia.Model.AcaoPendente;
import com.tcc.back_end.ia.Model.TipoAcaoIA;
import com.tcc.back_end.ia.Service.AcaoPendenteService;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AcaoPendenteServiceTest {

    static class RelogioMutavel extends Clock {
        Instant agora = Instant.parse("2026-01-01T10:00:00Z");

        @Override public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId z) { return this; }
        @Override public Instant instant() { return agora; }
    }

    @Test
    void expiraUsoUnicoEDonoUnico() {
        RelogioMutavel relogio = new RelogioMutavel();
        AcaoPendenteService servico = new AcaoPendenteService(relogio, 300);

        AcaoPendente a = servico.criar("ADM001", TipoAcaoIA.ALTERAR_APARENCIA,
                "x", Map.of("aparencia", "escuro"));

        assertTrue(servico.consumir(a.id(), "OUTRO").isEmpty());
        assertTrue(servico.consumir(a.id(), "ADM001").isPresent());
        assertTrue(servico.consumir(a.id(), "ADM001").isEmpty());

        AcaoPendente b = servico.criar("ADM001", TipoAcaoIA.ALTERAR_APARENCIA,
                "x", Map.of("aparencia", "claro"));
        relogio.agora = relogio.agora.plus(Duration.ofSeconds(301));
        assertTrue(servico.consumir(b.id(), "ADM001").isEmpty());
        assertTrue(servico.doUsuario("ADM001").isEmpty());
    }

    @Test
    void novaAcaoSubstituiAAnteriorDoMesmoUsuario() {
        AcaoPendenteService servico = new AcaoPendenteService(Clock.systemUTC(), 300);

        AcaoPendente a = servico.criar("ADM001", TipoAcaoIA.ALTERAR_APARENCIA,
                "x", Map.of("aparencia", "escuro"));
        AcaoPendente b = servico.criar("ADM001", TipoAcaoIA.ALTERAR_APARENCIA,
                "y", Map.of("aparencia", "claro"));

        assertTrue(servico.consumir(a.id(), "ADM001").isEmpty());
        assertEquals("y", servico.consumir(b.id(), "ADM001").orElseThrow().descricao());
    }
}
