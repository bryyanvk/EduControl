package com.tcc.back_end.ia.Model;

import java.time.Instant;
import java.util.Map;

/** Alteração proposta pela IA que ainda depende da confirmação do usuário. */
public record AcaoPendente(
        String id,
        String matriculaUsuario,
        TipoAcaoIA tipo,
        String descricao,
        Map<String, Object> parametros,
        Instant expiraEm
) {
}
