package com.tcc.back_end.ia;

import com.tcc.back_end.ia.Service.AssistenteIAService;
import com.tcc.back_end.ia.Service.ConhecimentoSistemaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Prova que o contexto completo sobe (sem mocks, sem SMTP) e que a base de
 * conhecimento é lida do classpath. Chave Gemini: "".
 */
@SpringBootTest(properties = {"gemini.api.key=",
        "educontrol.mail.remetente=", "spring.mail.host="})
class InicializacaoSemChaveIATest {

    @Autowired
    private AssistenteIAService assistente;

    @Autowired
    private ConhecimentoSistemaService conhecimento;

    @Test
    void contextoSobeELeBaseDeConhecimento() {
        assertNotNull(assistente);
        assertNotNull(conhecimento.secao("VISAO_GERAL"));
        assertNotNull(conhecimento.secao("AJUDA_PROFESSOR"));
    }
}
