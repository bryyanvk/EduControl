package com.tcc.back_end;

import com.tcc.back_end.Model.Team;
import com.tcc.back_end.Repository.TeamRepository;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Reproduz o que o navegador faz: cadteam -> login -> cadastros com HTTP Basic. */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class NavegadorFluxoTest {

    private static final String SENHA = "Abc@123:Çã#Ü Zz!";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static String basic(String usuario, String senha) {
        return "Basic " + Base64.getEncoder().encodeToString(
                (usuario + ":" + senha).getBytes(StandardCharsets.UTF_8));
    }

    private MockHttpServletResponse enviar(
            MockHttpServletRequestBuilder req, String auth, String corpo) throws Exception {
        if (auth != null) req.header("Authorization", auth);
        if (corpo != null) req.contentType(MediaType.APPLICATION_JSON).content(corpo);
        MockHttpServletResponse r = mvc.perform(req).andReturn().getResponse();
        r.setCharacterEncoding("UTF-8");
        return r;
    }

    private static String membro(String matricula, String cpf, String email, String tipo, String senha) {
        return "{\"matricula\":\"" + matricula + "\",\"nome\":\"Nome\",\"cpf\":\"" + cpf
                + "\",\"email\":\"" + email + "\",\"tipoAcesso\":\"" + tipo
                + "\",\"senha\":\"" + senha + "\"}";
    }

    @Test
    @Order(1)
    void senhaGravadaConfereComOBcryptDoLogin() throws Exception {

        assertEquals("Profissional cadastrado com sucesso!", enviar(post("/edu/cadteam"), null,
                membro("ADM001", "111", "Admin@Escola.com", "ADMINISTRADOR", SENHA)).getContentAsString(StandardCharsets.UTF_8));

        Team salvo = teamRepository.buscarTeamPorMatricula("ADM001");
        assertNotEquals(SENHA, salvo.getSenha());
        assertTrue(salvo.getSenha().startsWith("$2"), "deveria ser hash BCrypt");
        assertTrue(passwordEncoder.matches(SENHA, salvo.getSenha()), "hash único e correto");
        assertTrue(salvo.isAcessoAtivo());
    }

    @Test
    @Order(2)
    void loginECadastrosComMatriculaEComEmail() throws Exception {

        for (String usuario : new String[]{"ADM001", "Admin@Escola.com", "admin@escola.com"}) {

            assertEquals(200, enviar(post("/edu/login"), null,
                    "{\"identificador\":\"" + usuario + "\",\"senha\":\"" + SENHA + "\"}").getStatus(), usuario);

            String auth = basic(usuario, SENHA);

            assertEquals(200, enviar(get("/edu/listturma"), auth, null).getStatus(), usuario);
        }

        String auth = basic("ADM001", SENHA);

        MockHttpServletResponse turma = enviar(post("/edu/cadturma"), auth,
                "{\"nome\":\"1A\",\"curso\":\"Info\",\"turno\":\"Matutino\"}");
        assertEquals(200, turma.getStatus());
        assertEquals("Turma cadastrada com sucesso!", turma.getContentAsString(StandardCharsets.UTF_8));

        MockHttpServletResponse sala = enviar(post("/edu/cadsala"), basic("admin@escola.com", SENHA),
                "{\"numero\":1,\"capacidade\":30,\"andar\":\"1\",\"status\":\"DISPONIVEL\",\"turmas\":[{\"id\":1}]}");
        assertEquals(200, sala.getStatus());
        assertEquals("Sala cadastrada", sala.getContentAsString(StandardCharsets.UTF_8));

        MockHttpServletResponse aluno = enviar(post("/edu/cadsaln"), auth,
                "{\"nome\":\"Ana\",\"matricula\":\"M1\",\"turmaId\":1,\"turno\":\"Matutino\","
                        + "\"cartao\":{\"uid\":\"AA11\",\"ativo\":true}}");
        assertEquals(200, aluno.getStatus());
        assertEquals("Aluno cadastrado!!", aluno.getContentAsString(StandardCharsets.UTF_8));
    }

    @Test
    @Order(3)
    void erro401SoParaCredencialErradaEErro403ParaPerfilSemPermissao() throws Exception {

        String corpo = "{\"nome\":\"X\",\"curso\":\"Y\",\"turno\":\"Vespertino\"}";

        assertEquals(401, enviar(post("/edu/cadturma"), null, corpo).getStatus());
        assertEquals(401, enviar(post("/edu/cadturma"), basic("ADM001", "senha errada"), corpo).getStatus());
        assertEquals(401, enviar(post("/edu/cadturma"), basic("adm001", SENHA), corpo).getStatus(),
                "a matrícula diferencia maiúsculas de minúsculas");

        enviar(post("/edu/cadteam"), basic("ADM001", SENHA),
                membro("PRO001", "222", "prof@escola.com", "PROFESSOR", "professor123"));

        assertEquals(403, enviar(post("/edu/cadturma"), basic("PRO001", "professor123"), corpo).getStatus());
        assertEquals(403, enviar(post("/edu/cadsala"), basic("PRO001", "professor123"),
                "{\"numero\":2,\"capacidade\":10}").getStatus());
        assertEquals(403, enviar(post("/edu/cadsaln"), basic("PRO001", "professor123"),
                "{\"nome\":\"Z\",\"matricula\":\"Z1\",\"turmaId\":1}").getStatus());
    }

    @Test
    @Order(4)
    void preflightDoNavegadorFuncionaEmTodasAsRotasEOrigens() throws Exception {

        String[] origens = {"http://localhost:5173", "http://127.0.0.1:5173",
                "http://192.168.0.15:5173", "http://localhost:3000"};

        String[][] rotas = {{"/edu/login", "POST"}, {"/edu/cadturma", "POST"}, {"/edu/cadsala", "POST"},
                {"/edu/cadsaln", "POST"}, {"/edu/cadteam", "POST"}, {"/edu/updatealn/1", "PUT"},
                {"/edu/update/1", "PUT"}, {"/edu/deletealn/1", "DELETE"}, {"/edu/listaln", "GET"},
                {"/edu/rfid/estado", "PUT"}, {"/edu/senha/esqueci", "POST"}};

        for (String origem : origens) {
            for (String[] rota : rotas) {
                MockHttpServletResponse r = mvc.perform(options(rota[0])
                                .header("Origin", origem)
                                .header("Access-Control-Request-Method", rota[1])
                                .header("Access-Control-Request-Headers", "authorization,content-type"))
                        .andReturn().getResponse();

                assertEquals(200, r.getStatus(), origem + " " + rota[0]);
                assertEquals(origem, r.getHeader("Access-Control-Allow-Origin"), origem + " " + rota[0]);
                String permitidos = String.valueOf(r.getHeader("Access-Control-Allow-Headers")).toLowerCase();
                assertTrue(permitidos.contains("authorization") && permitidos.contains("content-type"), permitidos);
            }
        }

        // Resposta real (não só o preflight) também leva o cabeçalho CORS.
        MockHttpServletResponse real = mvc.perform(post("/edu/cadturma")
                        .header("Origin", "http://localhost:5173")
                        .header("Authorization", basic("ADM001", SENHA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"2B\",\"curso\":\"Info\",\"turno\":\"Vespertino\"}"))
                .andReturn().getResponse();
        assertEquals(200, real.getStatus());
        assertEquals("http://localhost:5173", real.getHeader("Access-Control-Allow-Origin"));
    }

    @Test
    @Order(5)
    void senhaMuitoLongaNaoQuebraOCadastro() throws Exception {

        String longa = "a".repeat(100);

        MockHttpServletResponse r = enviar(post("/edu/cadteam"), basic("ADM001", SENHA),
                membro("LONG01", "333", "longa@escola.com", "FUNCIONARIO", longa));

        assertTrue(r.getStatus() < 500, "status " + r.getStatus());
        assertTrue(r.getContentAsString(StandardCharsets.UTF_8).contains("72"),
                r.getContentAsString(StandardCharsets.UTF_8));
    }
}
