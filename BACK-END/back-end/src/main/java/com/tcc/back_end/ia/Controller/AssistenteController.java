
package com.tcc.back_end.ia.Controller;

import com.tcc.back_end.ia.DTO.PerguntaIARequest;
import com.tcc.back_end.ia.DTO.RespostaIAResponse;
import com.tcc.back_end.ia.Service.AssistenteIAService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ia")
public class AssistenteController {

    private final AssistenteIAService assistente;

    public AssistenteController(AssistenteIAService assistente) {
        this.assistente = assistente;
    }

    /**
     * Contrato antigo mantido: corpo {"pergunta": "..."} e resposta com "resposta".
     * Novo: quando a IA propõe uma alteração, a resposta traz "acaoPendente".
     */
    @PostMapping("/perguntar")
    public RespostaIAResponse perguntar(
            @RequestBody PerguntaIARequest request
    ) {
        if (request == null || request.pergunta() == null ||
                request.pergunta().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A pergunta não pode estar vazia."
            );
        }

        return assistente.perguntar(request.pergunta());
    }

    /** Passo 2: o usuário confirmou a ação proposta; o back executa. */
    @PostMapping("/acoes/{id}/confirmar")
    public RespostaIAResponse confirmar(@PathVariable String id) {
        return assistente.confirmar(id);
    }

    /** O usuário recusou a ação proposta; nada é alterado. */
    @PostMapping("/acoes/{id}/cancelar")
    public RespostaIAResponse cancelar(@PathVariable String id) {
        return assistente.cancelar(id);
    }

    @GetMapping("/resumo-diario")
    public RespostaIAResponse gerarResumoDiario() {
        return new RespostaIAResponse(assistente.gerarResumoDiario());
    }
}
