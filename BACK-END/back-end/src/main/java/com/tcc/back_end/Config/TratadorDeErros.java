package com.tcc.back_end.Config;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

/**
 * Devolve a mensagem de qualquer ResponseStatusException como texto simples,
 * que é o formato que o front-end exibe ao usuário.
 */
@RestControllerAdvice
public class TratadorDeErros {

    private static final MediaType TEXTO_UTF8 =
            new MediaType("text", "plain", StandardCharsets.UTF_8);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> tratar(ResponseStatusException erro) {

        String mensagem = erro.getReason() != null ? erro.getReason() : "";

        return ResponseEntity
                .status(erro.getStatusCode())
                .contentType(TEXTO_UTF8)
                .body(mensagem);
    }
}
