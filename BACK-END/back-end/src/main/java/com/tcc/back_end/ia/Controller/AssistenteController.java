
package com.tcc.back_end.ia.Controller;

import com.tcc.back_end.ia.DTO.PerguntaIARequest;
import com.tcc.back_end.ia.DTO.RespostaIAResponse;
import com.tcc.back_end.ia.Service.GeminiService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ia")
public class AssistenteController {

    private final GeminiService geminiService;

    public AssistenteController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/perguntar")
    public RespostaIAResponse perguntar(
            @RequestBody PerguntaIARequest request
    ) {
        if (request.pergunta() == null ||
                request.pergunta().isBlank()) {
            throw new IllegalArgumentException(
                    "A pergunta não pode estar vazia."
            );
        }

        String resposta = geminiService.gerarResposta(
                request.pergunta()
        );

        return new RespostaIAResponse(resposta);
    }

    @GetMapping("/resumo-diario")
    public RespostaIAResponse gerarResumoDiario() {

        String resumo = geminiService.gerarResumoDiario();

        return new RespostaIAResponse(resumo);
    }
}
