package com.tcc.back_end.ia.Service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Base de conhecimento do EduControl (telas, funções e perfis reais), lida de
 * src/main/resources/ia/conhecimento-educontrol.md. Cada "## CHAVE" é uma seção.
 * Edite o arquivo quando o sistema mudar: a IA passa a responder o novo texto.
 */
@Service
public class ConhecimentoSistemaService {

    private final Map<String, String> secoes = new LinkedHashMap<>();

    public ConhecimentoSistemaService() {
        try (InputStream in = new ClassPathResource(
                "ia/conhecimento-educontrol.md").getInputStream()) {

            String texto = new String(in.readAllBytes(), StandardCharsets.UTF_8);

            String chave = null;
            StringBuilder corpo = new StringBuilder();

            for (String linha : texto.split("\\R")) {

                if (linha.startsWith("## ")) {
                    if (chave != null) {
                        secoes.put(chave, corpo.toString().trim());
                    }
                    chave = linha.substring(3).trim();
                    corpo.setLength(0);
                } else {
                    corpo.append(linha).append('\n');
                }
            }

            if (chave != null) {
                secoes.put(chave, corpo.toString().trim());
            }

        } catch (IOException erro) {
            throw new IllegalStateException(
                    "Não foi possível ler a base de conhecimento da IA.", erro);
        }
    }

    /** Texto da seção ou null se não existir. */
    public String secao(String chave) {
        return secoes.get(chave);
    }

    /** Tudo, para o prompt do Gemini (exceto as ajudas por perfil, que são para o usuário). */
    public String textoParaPrompt() {
        StringBuilder sb = new StringBuilder();

        secoes.forEach((chave, corpo) -> {
            if (!chave.startsWith("AJUDA_")) {
                sb.append("[").append(chave).append("]\n")
                        .append(corpo).append("\n\n");
            }
        });

        return sb.toString();
    }
}
