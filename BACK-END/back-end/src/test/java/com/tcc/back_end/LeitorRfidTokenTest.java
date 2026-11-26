package com.tcc.back_end;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** Com educontrol.dispositivo.token definido, o leitor RFID precisa enviar X-Device-Token. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "educontrol.dispositivo.token=segredo-do-pico")
class LeitorRfidTokenTest {

    @Autowired
    private MockMvc mvc;

    private int enviar(String token) throws Exception {
        var req = post("/edu/rfid")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"uid\":\"A1B2C3D4\"}");

        if (token != null) {
            req.header("X-Device-Token", token);
        }

        return mvc.perform(req).andReturn().getResponse().getStatus();
    }

    @Test
    void exigeTokenDoDispositivo() throws Exception {
        assertEquals(401, enviar(null));
        assertEquals(401, enviar("errado"));
        int comToken = enviar("segredo-do-pico");
        assertEquals(true, comToken != 401 && comToken != 403, "status " + comToken);
    }
}
