package com.tcc.back_end.ia.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * Ação que a IA propôs (acaoPendente) ou que já foi executada (acaoExecutada).
 *
 * tipo: ALTERAR_APARENCIA | ALTERAR_NOTIFICACAO
 * parametros: ALTERAR_APARENCIA -> {"aparencia": "claro|escuro|auto"}
 *             ALTERAR_NOTIFICACAO -> {"campo": "faltasAtrasos", "valor": true}
 * expiraEm: só na ação pendente (ISO-8601, UTC).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AcaoIADTO(
        String id,
        String tipo,
        String descricao,
        Map<String, Object> parametros,
        String expiraEm
) {
}
