
package com.tcc.back_end.ia.Service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;

import org.springframework.stereotype.Service;

@Service
public class GeminiService {

    private final Client geminiClient;
    private final ContextoEscolarService contextoEscolarService;

    public GeminiService(
            Client geminiClient,
            ContextoEscolarService contextoEscolarService) {

        this.geminiClient = geminiClient;
        this.contextoEscolarService = contextoEscolarService;
    }

    public String gerarResposta(String pergunta) {

        String contexto =
                contextoEscolarService.montarContextoEscolar();

        String prompt = """
                Você é o assistente inteligente do EduControl,
                um sistema de gestão escolar.

                Sua função é auxiliar a secretaria escolar,
                interpretar informações e responder perguntas
                sobre o funcionamento da escola.

                REGRAS:
                1. Responda em português brasileiro.
                2. Seja claro, objetivo e profissional.
                3. Utilize os dados reais fornecidos no contexto.
                4. Nunca invente informações.
                5. Se não souber algo, informe que não possui os dados.
                6. Não afirme que realizou operações no sistema.
                7. Não invente nomes, números ou estatísticas.

                """ + contexto + """

                PERGUNTA DO USUÁRIO:
                """ + pergunta;

        GenerateContentResponse resposta =
                geminiClient.models.generateContent(
                        "gemini-3.5-flash-lite",
                        prompt,
                        null
                );

        return resposta.text();
    }
}
