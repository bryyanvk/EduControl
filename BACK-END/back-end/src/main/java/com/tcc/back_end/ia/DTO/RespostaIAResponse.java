package com.tcc.back_end.ia.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Contrato do front: "resposta" continua sendo o texto a exibir.
 * "acaoPendente" e "acaoExecutada" só aparecem quando existem (NON_NULL),
 * então o front antigo, que lê apenas "resposta", segue funcionando.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RespostaIAResponse(
        String resposta,
        AcaoIADTO acaoPendente,
        AcaoIADTO acaoExecutada
) {

    public RespostaIAResponse(String resposta) {
        this(resposta, null, null);
    }
}
