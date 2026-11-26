package com.tcc.back_end;

import com.tcc.back_end.Repository.PresencaRepository;
import com.tcc.back_end.Service.EmailService;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * Fluxo completo da API (login, perfis, notificações, recuperação de senha,
 * sala sem turma, RFID único e exclusão de aluno). Os dados ficam em memória.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FluxoEduControlTest {

    private static final String ADMIN = basic("ADM001", "senhaforte1");
    private static final String PROFESSOR = basic("PRO001", "professor123");

    @Autowired
    private MockMvc mvc;

    @Autowired
    private PresencaRepository presencaRepository;

    @MockitoBean
    private EmailService emailService;

    private static String basic(String usuario, String senha) {
        return "Basic " + Base64.getEncoder().encodeToString(
                (usuario + ":" + senha).getBytes(StandardCharsets.UTF_8));
    }

    private MockHttpServletResponse enviar(
            MockHttpServletRequestBuilder requisicao,
            String autorizacao,
            String corpo
    ) throws Exception {

        if (autorizacao != null) {
            requisicao.header("Authorization", autorizacao);
        }

        if (corpo != null) {
            requisicao.contentType(MediaType.APPLICATION_JSON).content(corpo);
        }

        MockHttpServletResponse resposta =
                mvc.perform(requisicao).andReturn().getResponse();

        resposta.setCharacterEncoding("UTF-8");

        return resposta;
    }

    private static String texto(MockHttpServletResponse resposta) throws Exception {
        return resposta.getContentAsString(StandardCharsets.UTF_8);
    }

    private static String funcionario(
            String matricula, String cpf, String email,
            String tipo, String senha
    ) {
        return "{\"matricula\":\"" + matricula + "\",\"nome\":\"Nome " + matricula
                + "\",\"cpf\":\"" + cpf + "\",\"email\":\"" + email
                + "\",\"tipoAcesso\":\"" + tipo + "\",\"senha\":\"" + senha
                + "\",\"cargo\":\"Cargo\",\"telefone\":\"1199999\","
                + "\"fimContrato\":\"2027-12-31\"}";
    }

    private String notificacoes() throws Exception {
        return texto(enviar(get("/edu/notificacoes"), ADMIN, null));
    }

    // ------------------------------------------------------------------
    // Login e perfis
    // ------------------------------------------------------------------

    @Test
    @Order(1)
    void primeiroUsuarioPrecisaSerAdministradorECadastroFicaProtegido() throws Exception {

        assertEquals(401, enviar(get("/edu/listaln"), null, null).getStatus());

        String recusado = texto(enviar(post("/edu/cadteam"), null,
                funcionario("PRO001", "222", "prof@escola.com", "PROFESSOR", "professor123")));
        assertTrue(recusado.contains("primeiro usuário"), recusado);

        MockHttpServletResponse primeiro = enviar(post("/edu/cadteam"), null,
                funcionario("ADM001", "111", "admin@escola.com", "ADMINISTRADOR", "senhaforte1"));
        assertEquals("Profissional cadastrado com sucesso!", texto(primeiro));

        // A partir daqui, cadastrar equipe exige administrador.
        assertEquals(401, enviar(post("/edu/cadteam"), null,
                funcionario("PRO001", "222", "prof@escola.com", "PROFESSOR", "professor123")).getStatus());

        assertEquals("Profissional cadastrado com sucesso!", texto(enviar(post("/edu/cadteam"), ADMIN,
                funcionario("PRO001", "222", "prof@escola.com", "PROFESSOR", "professor123"))));

        assertEquals(403, enviar(post("/edu/cadteam"), PROFESSOR,
                funcionario("PRO002", "333", "p2@escola.com", "PROFESSOR", "professor123")).getStatus());
    }

    @Test
    @Order(2)
    void loginDevolveIdEDadosDoPerfil() throws Exception {

        MockHttpServletResponse porMatricula = enviar(post("/edu/login"), null,
                "{\"identificador\":\"ADM001\",\"senha\":\"senhaforte1\"}");
        assertEquals(200, porMatricula.getStatus());
        String json = texto(porMatricula);
        assertTrue(json.contains("\"id\":1"), json);
        assertTrue(json.contains("\"matricula\":\"ADM001\""), json);
        assertTrue(json.contains("\"tipoAcesso\":\"ADMINISTRADOR\""), json);
        assertTrue(json.contains("\"cargo\":\"Cargo\""), json);
        assertFalse(json.contains("senha"), json);

        MockHttpServletResponse porEmail = enviar(post("/edu/login"), null,
                "{\"identificador\":\"prof@escola.com\",\"senha\":\"professor123\"}");
        assertEquals(200, porEmail.getStatus());
        assertTrue(texto(porEmail).contains("\"id\":2"));

        MockHttpServletResponse errada = enviar(post("/edu/login"), null,
                "{\"identificador\":\"ADM001\",\"senha\":\"errada\"}");
        assertEquals(401, errada.getStatus());
        assertEquals("Senha incorreta.", texto(errada));

        assertEquals("Usuário não encontrado.", texto(enviar(post("/edu/login"), null,
                "{\"identificador\":\"XXXX\",\"senha\":\"abc\"}")));
    }

    @Test
    @Order(2)
    void perfisEPreflightDeCors() throws Exception {

        assertEquals(200, enviar(get("/edu/listaln"), PROFESSOR, null).getStatus());
        assertEquals(403, enviar(post("/edu/cadturma"), PROFESSOR,
                "{\"nome\":\"X\",\"curso\":\"Y\",\"turno\":\"Matutino\"}").getStatus());
        assertEquals(403, enviar(get("/edu/listteam"), PROFESSOR, null).getStatus());
        assertEquals(200, enviar(get("/edu/listteam"), ADMIN, null).getStatus());
        assertEquals(200, enviar(get("/edu/config/geral"), PROFESSOR, null).getStatus());
        assertEquals(403, enviar(get("/edu/config/rfid"), PROFESSOR, null).getStatus());
        assertEquals(401, enviar(get("/edu/listaln"), basic("ADM001", "errada"), null).getStatus());

        MockHttpServletResponse preflight = mvc.perform(options("/edu/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,authorization"))
                .andReturn().getResponse();
        assertEquals(200, preflight.getStatus());
        assertEquals("http://localhost:5173",
                preflight.getHeader("Access-Control-Allow-Origin"));
    }

    @Test
    @Order(3)
    void leitorRfidEnviaSemBasicEEstadoDoLeitorRespeitaPerfis() throws Exception {

        // O Pico não envia Authorization: não pode dar 401.
        MockHttpServletResponse pico = enviar(post("/edu/rfid"), null, "{\"uid\":\"A1B2C3D4\"}");
        assertTrue(pico.getStatus() != 401 && pico.getStatus() != 403, "status " + pico.getStatus());
        assertFalse(texto(pico).contains("Registro salvo com sucesso"), texto(pico));

        assertEquals(200, enviar(get("/edu/rfid/estado"), PROFESSOR, null).getStatus());
        assertEquals(403, enviar(put("/edu/rfid/estado?ativo=false"), PROFESSOR, null).getStatus());
        assertEquals(200, enviar(put("/edu/rfid/estado?ativo=false"), ADMIN, null).getStatus());
        assertEquals("false", texto(enviar(get("/edu/rfid/estado"), ADMIN, null)));
        assertEquals(200, enviar(put("/edu/rfid/estado?ativo=true"), ADMIN, null).getStatus());

        // Rotas de cadastro continuam exigindo login.
        assertEquals(401, enviar(post("/edu/cadturma"), null,
                "{\"nome\":\"X\",\"curso\":\"Y\",\"turno\":\"Matutino\"}").getStatus());
        assertEquals(401, enviar(get("/edu/listpres"), null, null).getStatus());
        assertEquals(200, enviar(get("/edu/listpres"), ADMIN, null).getStatus());
    }

    @Test
    @Order(4)
    void listaDeEquipeTrazOsCamposCompletos() throws Exception {

        String json = texto(enviar(get("/edu/listteam"), ADMIN, null));

        for (String campo : new String[]{"cpf", "dataNascimento", "dataAdmissao",
                "jornadaSemanal", "tipoVinculo", "endereco", "acessoAtivo",
                "fotoPerfil", "fimContrato"}) {
            assertTrue(json.contains("\"" + campo + "\""), "faltou " + campo);
        }

        assertTrue(json.contains("\"fimContrato\":\"2027-12-31\""), json);
        assertFalse(json.contains("\"senha\""), json);
    }

    // ------------------------------------------------------------------
    // Sala sem turma, turma e notificações automáticas
    // ------------------------------------------------------------------

    @Test
    @Order(5)
    void salaPodeSerCadastradaSemTurmaEDepoisReceberTurma() throws Exception {

        assertEquals("Turma cadastrada com sucesso!", texto(enviar(post("/edu/cadturma"), ADMIN,
                "{\"nome\":\"1A\",\"curso\":\"Informática\",\"turno\":\"Matutino\"}")));

        assertEquals("Sala cadastrada", texto(enviar(post("/edu/cadsala"), ADMIN,
                "{\"numero\":10,\"capacidade\":30,\"andar\":\"1\",\"turmas\":[]}")));

        assertEquals("Sala cadastrada", texto(enviar(post("/edu/cadsala"), ADMIN,
                "{\"numero\":11,\"capacidade\":30,\"andar\":\"1\"}")));

        // Turma inexistente continua sendo recusada.
        assertEquals("Turma não encontrada", texto(enviar(post("/edu/cadsala"), ADMIN,
                "{\"numero\":12,\"capacidade\":30,\"andar\":\"1\",\"turmas\":[{\"id\":99}]}")));

        // Vincular a turma depois do cadastro.
        assertEquals("Sala atualizada com sucesso!", texto(enviar(put("/edu/update/10"), ADMIN,
                "{\"capacidade\":30,\"andar\":\"1\",\"turmas\":[{\"id\":1}]}")));

        String sala = texto(enviar(get("/edu/encsala/10"), ADMIN, null));
        assertTrue(sala.contains("\"nome\":\"1A\""), sala);

        // A mesma turma não pode ir para outra sala.
        assertEquals("Essa turma ja esta associada a outra sala", texto(enviar(put("/edu/update/11"), ADMIN,
                "{\"capacidade\":30,\"andar\":\"1\",\"turmas\":[{\"id\":1}]}")));

        // Editar a própria sala mantendo a turma é permitido.
        assertEquals("Sala atualizada com sucesso!", texto(enviar(put("/edu/update/10"), ADMIN,
                "{\"capacidade\":35,\"andar\":\"1\",\"turmas\":[{\"id\":1}]}")));
    }

    @Test
    @Order(6)
    void eventosGeramNotificacoes() throws Exception {

        String lista = notificacoes();

        assertTrue(lista.contains("\"tipo\":\"NOVO_FUNCIONARIO\""), lista);
        assertTrue(lista.contains("\"tipo\":\"NOVA_TURMA\""), lista);
        assertTrue(lista.contains("\"tipo\":\"NOVA_SALA\""), lista);
        assertTrue(lista.contains("\"rota\":\"/team\""), lista);
        assertTrue(lista.contains("\"rota\":\"/salas\""), lista);
    }

    @Test
    @Order(7)
    void aparenciaGeraNotificacaoSoQuandoMuda() throws Exception {

        assertFalse(notificacoes().contains("APARENCIA_ALTERADA"));

        enviar(put("/edu/config/geral"), ADMIN, "{\"aparencia\":\"escuro\",\"idioma\":\"pt-BR\"}");
        enviar(put("/edu/config/geral"), ADMIN, "{\"aparencia\":\"escuro\",\"idioma\":\"en-US\"}");

        String lista = notificacoes();

        assertTrue(lista.contains("\"tipo\":\"APARENCIA_ALTERADA\""), lista);
        assertEquals(1, lista.split("\"tipo\":\"APARENCIA_ALTERADA\"", -1).length - 1);
    }

    // ------------------------------------------------------------------
    // RFID único e exclusão de aluno
    // ------------------------------------------------------------------

    private static String aluno(String nome, String matricula, String uid) {
        return "{\"nome\":\"" + nome + "\",\"matricula\":\"" + matricula
                + "\",\"turmaId\":1,\"turno\":\"Matutino\",\"cartao\":{\"uid\":\""
                + uid + "\",\"ativo\":true}}";
    }

    @Test
    @Order(8)
    void cartaoRfidNaoPodeSerRepetido() throws Exception {

        assertEquals("Aluno cadastrado!!", texto(enviar(post("/edu/cadsaln"), ADMIN,
                aluno("Ana", "M001", "AA11BB22"))));

        MockHttpServletResponse duplicado = enviar(post("/edu/cadsaln"), ADMIN,
                aluno("Bruno", "M002", "AA11BB22"));
        assertEquals(409, duplicado.getStatus());
        String mensagem = texto(duplicado);
        assertTrue(mensagem.contains("já está vinculado ao aluno Ana"), mensagem);
        assertTrue(mensagem.contains("M001"), mensagem);

        // Diferença de maiúsculas e espaços não engana a validação.
        assertEquals(409, enviar(post("/edu/cadsaln"), ADMIN,
                aluno("Bruno", "M002", " aa11bb22 ")).getStatus());

        assertEquals("Aluno cadastrado!!", texto(enviar(post("/edu/cadsaln"), ADMIN,
                aluno("Bruno", "M002", "CC33DD44"))));

        // Na edição: manter o próprio cartão é permitido, usar o de outro não.
        assertEquals("Dados do aluno atualizados com sucesso!", texto(enviar(put("/edu/updatealn/1"), ADMIN,
                aluno("Ana Maria", "M001", "AA11BB22"))));

        MockHttpServletResponse conflito = enviar(put("/edu/updatealn/2"), ADMIN,
                aluno("Bruno", "M002", "AA11BB22"));
        assertEquals(409, conflito.getStatus());
        assertTrue(texto(conflito).contains("Ana Maria"));
    }

    @Test
    @Order(9)
    void alunoExcluidoSaiDasListagensMasHistoricoFicaGuardado() throws Exception {

        assertEquals("Registro salvo com sucesso!!", texto(enviar(post("/edu/manual"), ADMIN,
                "{\"alunoId\":1,\"data\":\"2026-11-23\",\"horario\":\"07:00:00\",\"status\":\"PRESENTE\"}")));

        assertTrue(texto(enviar(get("/edu/listpres"), ADMIN, null)).contains("Ana Maria"));
        assertTrue(texto(enviar(get("/edu/listaln"), ADMIN, null)).contains("Ana Maria"));

        // Professor não exclui; administrador sim.
        assertEquals(403, enviar(delete("/edu/deletealn/1"), PROFESSOR, null).getStatus());
        assertEquals("Aluno deletado com sucesso!", texto(enviar(delete("/edu/deletealn/1"), ADMIN, null)));
        assertEquals("Aluno não encontrado!", texto(enviar(delete("/edu/deletealn/1"), ADMIN, null)));

        assertFalse(texto(enviar(get("/edu/listaln"), ADMIN, null)).contains("Ana Maria"));
        assertFalse(texto(enviar(get("/edu/listpres"), ADMIN, null)).contains("Ana Maria"));
        assertEquals(404, enviar(get("/edu/encaln/1"), ADMIN, null).getStatus());
        assertEquals(404, enviar(get("/edu/enc/AA11BB22"), ADMIN, null).getStatus());
        // O cartão do aluno excluído não registra presença (leitor desativado ou aluno não encontrado).
        assertFalse(texto(enviar(get("/edu/reg/AA11BB22"), ADMIN, null)).contains("Registro salvo"));
        assertEquals(404, enviar(post("/edu/manual"), ADMIN,
                "{\"alunoId\":1,\"data\":\"2026-11-24\",\"horario\":\"07:00:00\",\"status\":\"PRESENTE\"}").getStatus());

        // O histórico continua guardado.
        assertEquals(1, presencaRepository.getHistoricoCompleto().size());
        assertEquals(0, presencaRepository.getListaRegistro().size());

        // O cartão e a matrícula do aluno excluído ficam livres.
        assertEquals("Aluno cadastrado!!", texto(enviar(post("/edu/cadsaln"), ADMIN,
                aluno("Carla", "M001", "AA11BB22"))));
    }

    // ------------------------------------------------------------------
    // Senha: alteração pela equipe e recuperação por e-mail
    // ------------------------------------------------------------------

    @Test
    @Order(10)
    void alterarSenhaDaEquipeGeraNotificacao() throws Exception {

        assertFalse(notificacoes().contains("SENHA_ALTERADA"));

        // Editar sem informar senha não gera aviso de senha.
        String semSenha = funcionario("PRO001", "222", "prof@escola.com", "PROFESSOR", "");

        assertEquals("Profissional atualizado com sucesso!",
                texto(enviar(put("/edu/upteam/2"), ADMIN, semSenha)));
        assertFalse(notificacoes().contains("SENHA_ALTERADA"));

        assertEquals("Profissional atualizado com sucesso!",
                texto(enviar(put("/edu/upteam/2"), ADMIN,
                        funcionario("PRO001", "222", "prof@escola.com", "PROFESSOR", "professor123"))));

        assertTrue(notificacoes().contains("\"tipo\":\"SENHA_ALTERADA\""));
        assertEquals(200, enviar(post("/edu/login"), null,
                "{\"identificador\":\"PRO001\",\"senha\":\"professor123\"}").getStatus());
    }

    private String solicitarCodigo(String email) throws Exception {

        MockHttpServletResponse resposta = enviar(post("/edu/senha/esqueci"), null,
                "{\"email\":\"" + email + "\"}");

        assertEquals(200, resposta.getStatus());

        return texto(resposta);
    }

    @Test
    @Order(11)
    void recuperacaoDeSenhaPorCodigo() throws Exception {

        // E-mail inexistente: mesma resposta, nenhum e-mail enviado.
        String generica = solicitarCodigo("ninguem@escola.com");
        assertEquals(generica, solicitarCodigo("prof@escola.com"));

        ArgumentCaptor<String> codigo = ArgumentCaptor.forClass(String.class);
        verify(emailService, atLeastOnce()).enviarCodigoRecuperacao(
                eq("prof@escola.com"), anyString(), codigo.capture(), anyInt());
        String valido = codigo.getValue();
        assertTrue(valido.matches("\\d{6}"), valido);

        String errado = "000000".equals(valido) ? "111111" : "000000";

        // Código errado e senha curta são recusados com 400.
        MockHttpServletResponse invalido = enviar(post("/edu/senha/redefinir"), null,
                "{\"email\":\"prof@escola.com\",\"codigo\":\"" + errado + "\",\"novaSenha\":\"novaSenha123\"}");
        assertEquals(400, invalido.getStatus());
        assertTrue(texto(invalido).contains("Código inválido"));

        MockHttpServletResponse curta = enviar(post("/edu/senha/redefinir"), null,
                "{\"email\":\"prof@escola.com\",\"codigo\":\"" + valido + "\",\"novaSenha\":\"curta\"}");
        assertEquals(400, curta.getStatus());
        assertTrue(texto(curta).contains("pelo menos 8"));

        // Código certo redefine a senha; depois ele não vale mais.
        MockHttpServletResponse ok = enviar(post("/edu/senha/redefinir"), null,
                "{\"email\":\"prof@escola.com\",\"codigo\":\"" + valido + "\",\"novaSenha\":\"novaSenha123\"}");
        assertEquals(200, ok.getStatus());

        assertEquals(401, enviar(post("/edu/login"), null,
                "{\"identificador\":\"PRO001\",\"senha\":\"professor123\"}").getStatus());
        assertEquals(200, enviar(post("/edu/login"), null,
                "{\"identificador\":\"PRO001\",\"senha\":\"novaSenha123\"}").getStatus());

        assertEquals(400, enviar(post("/edu/senha/redefinir"), null,
                "{\"email\":\"prof@escola.com\",\"codigo\":\"" + valido + "\",\"novaSenha\":\"outraSenha123\"}").getStatus());
    }

    @Test
    @Order(12)
    void codigoEInvalidadoDepoisDeCincoTentativasErradas() throws Exception {

        solicitarCodigo("admin@escola.com");

        ArgumentCaptor<String> codigo = ArgumentCaptor.forClass(String.class);
        verify(emailService, atLeastOnce()).enviarCodigoRecuperacao(
                eq("admin@escola.com"), anyString(), codigo.capture(), anyInt());
        String valido = codigo.getValue();
        String errado = "000000".equals(valido) ? "111111" : "000000";

        for (int i = 0; i < 5; i++) {
            assertEquals(400, enviar(post("/edu/senha/redefinir"), null,
                    "{\"email\":\"admin@escola.com\",\"codigo\":\"" + errado + "\",\"novaSenha\":\"novaSenha123\"}").getStatus());
        }

        // Mesmo o código certo não funciona mais: é preciso pedir outro.
        assertEquals(400, enviar(post("/edu/senha/redefinir"), null,
                "{\"email\":\"admin@escola.com\",\"codigo\":\"" + valido + "\",\"novaSenha\":\"novaSenha123\"}").getStatus());

        assertEquals(200, enviar(post("/edu/login"), null,
                "{\"identificador\":\"ADM001\",\"senha\":\"senhaforte1\"}").getStatus());
    }

    @Test
    @Order(20)
    void trocarTurmaDaSalaSubstituiEmVezDeDuplicar() throws Exception {

        enviar(post("/edu/cadturma"), ADMIN, "{\"nome\":\"2B\",\"curso\":\"Redes\",\"turno\":\"Vespertino\"}");
        enviar(post("/edu/cadturma"), ADMIN, "{\"nome\":\"3C\",\"curso\":\"Redes\",\"turno\":\"Vespertino\"}");
        assertEquals("Sala cadastrada", texto(enviar(post("/edu/cadsala"), ADMIN,
                "{\"numero\":20,\"capacidade\":30,\"andar\":\"2\",\"turmas\":[{\"id\":2}]}")));

        // Front envia so a lista final (turma 3 no lugar da 2).
        assertEquals("Sala atualizada com sucesso!", texto(enviar(put("/edu/update/20"), ADMIN,
                "{\"numero\":20,\"capacidade\":30,\"andar\":\"2\",\"status\":\"DISPONIVEL\",\"turmas\":[{\"id\":3}]}")));

        String sala = texto(enviar(get("/edu/encsala/20"), ADMIN, null));
        assertTrue(sala.contains("3C") && !sala.contains("2B"), sala);
        assertEquals(1, sala.split("\"id\":").length - 1, sala);

        // A turma antiga ficou livre para outra sala.
        assertEquals("Sala cadastrada", texto(enviar(post("/edu/cadsala"), ADMIN,
                "{\"numero\":21,\"capacidade\":30,\"andar\":\"2\",\"turmas\":[{\"id\":2}]}")));

        // Sala sem turma continua permitida.
        assertEquals("Sala atualizada com sucesso!", texto(enviar(put("/edu/update/20"), ADMIN,
                "{\"capacidade\":30,\"andar\":\"2\",\"turmas\":[]}")));
        assertTrue(texto(enviar(get("/edu/encsala/20"), ADMIN, null)).contains("\"turmas\":[]"));

        // Formato antigo do front: "turma" no singular.
        assertEquals("Sala atualizada com sucesso!", texto(enviar(put("/edu/update/20"), ADMIN,
                "{\"capacidade\":30,\"andar\":\"2\",\"turma\":{\"id\":3,\"nome\":\"3C\"}}")));
        String unica = texto(enviar(get("/edu/encsala/20"), ADMIN, null));
        assertTrue(unica.contains("3C") && !unica.contains("\"turma\":"), unica);
    }
}
