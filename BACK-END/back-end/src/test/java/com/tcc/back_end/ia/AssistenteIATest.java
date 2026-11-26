package com.tcc.back_end.ia;

import com.jayway.jsonpath.JsonPath;
import com.tcc.back_end.Service.EmailService;
import com.tcc.back_end.ia.Service.GeminiService;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * IA com dados e configurações reais: contagem e telefone da equipe,
 * permissões por perfil e alteração de configurações em dois passos.
 * O Gemini é simulado: o que é dado real nunca depende dele.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AssistenteIATest {

    private static final String ADMIN = basic("ADM001", "senhaforte1");
    private static final String FUNC = basic("FUN001", "funcionario1");
    private static final String JOAO = basic("PRO001", "professor123");

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private GeminiService gemini;

    private static String basic(String usuario, String senha) {
        return "Basic " + Base64.getEncoder().encodeToString(
                (usuario + ":" + senha).getBytes(StandardCharsets.UTF_8));
    }

    private MockHttpServletResponse enviar(
            MockHttpServletRequestBuilder requisicao, String auth, String corpo
    ) throws Exception {
        if (auth != null) {
            requisicao.header("Authorization", auth);
        }
        if (corpo != null) {
            requisicao.contentType(MediaType.APPLICATION_JSON).content(corpo);
        }
        MockHttpServletResponse r = mvc.perform(requisicao).andReturn().getResponse();
        r.setCharacterEncoding("UTF-8");
        return r;
    }

    private String corpo(MockHttpServletResponse r) throws Exception {
        return r.getContentAsString(StandardCharsets.UTF_8);
    }

    private MockHttpServletResponse perguntar(String auth, String pergunta) throws Exception {
        return enviar(post("/api/ia/perguntar"), auth,
                "{\"pergunta\":\"" + pergunta + "\"}");
    }

    private String resposta(String auth, String pergunta) throws Exception {
        MockHttpServletResponse r = perguntar(auth, pergunta);
        assertEquals(200, r.getStatus(), corpo(r));
        return JsonPath.read(corpo(r), "$.resposta");
    }

    private static String membro(String matricula, String nome, String cpf,
                                 String email, String tipo, String senha,
                                 String telefone) {
        return "{\"matricula\":\"" + matricula + "\",\"nome\":\"" + nome
                + "\",\"cpf\":\"" + cpf + "\",\"email\":\"" + email
                + "\",\"tipoAcesso\":\"" + tipo + "\",\"senha\":\"" + senha
                + "\",\"cargo\":\"Cargo\""
                + (telefone == null ? "" : ",\"telefone\":\"" + telefone + "\"")
                + ",\"fimContrato\":\"2027-12-31\"}";
    }

    private void cadastrar(String auth, String json) throws Exception {
        assertEquals("Profissional cadastrado com sucesso!",
                corpo(enviar(post("/edu/cadteam"), auth, json)));
    }

    // ------------------------------------------------------------------

    @Test
    @Order(1)
    void prepararEquipe() throws Exception {
        cadastrar(null, membro("ADM001", "Ana Admin", "111", "adm@e.com",
                "ADMINISTRADOR", "senhaforte1", "1100000"));
        cadastrar(ADMIN, membro("FUN001", "Carla Secretaria", "222", "fun@e.com",
                "FUNCIONARIO", "funcionario1", "1133333"));
        cadastrar(ADMIN, membro("PRO001", "Joao Silva", "333", "joao@e.com",
                "PROFESSOR", "professor123", "11 91111-1111"));
        cadastrar(ADMIN, membro("PRO002", "Maria Souza", "444", "maria@e.com",
                "PROFESSOR", "professor123", "11 92222-2222"));
        cadastrar(ADMIN, membro("PRO003", "Joana Silva", "555", "joana@e.com",
                "PROFESSOR", "professor123", "11 93333-3333"));
        cadastrar(ADMIN, membro("PRO004", "Pedro Semfone", "666", "pedro@e.com",
                "PROFESSOR", "professor123", null));
    }

    @Test
    @Order(2)
    void contaProfessoresEFuncionariosReais() throws Exception {

        String professores = resposta(ADMIN, "Quantos professores existem no sistema?");
        assertTrue(professores.contains("4 professores"), professores);

        String funcionarios = resposta(JOAO, "quantos funcionários temos?");
        assertTrue(funcionarios.contains("1 funcionário"), funcionarios);

        String equipe = resposta(FUNC, "qual o numero de professores e funcionarios");
        assertTrue(equipe.contains("4 professores")
                && equipe.contains("1 funcionário"), equipe);

        verify(gemini, never()).gerarResposta(anyString(), anyString());
    }

    @Test
    @Order(3)
    void administradorEFuncionarioVeemTelefoneDeProfessor() throws Exception {

        String r = resposta(ADMIN, "Qual o telefone da professora Maria Souza?");
        assertTrue(r.contains("11 92222-2222") && r.contains("Maria Souza"), r);

        String porNumero = resposta(FUNC, "me passa o numero do professor Joao Silva");
        assertTrue(porNumero.contains("11 91111-1111"), porNumero);

        verify(gemini, never()).gerarResposta(anyString(), anyString());
    }

    @Test
    @Order(4)
    void naoInventaQuandoNaoEncontraOuNaoHaTelefone() throws Exception {

        String inexistente = resposta(ADMIN, "telefone do professor Zacarias Inexistente");
        assertTrue(inexistente.contains("Não encontrei"), inexistente);
        assertFalse(inexistente.matches(".*\\d{4}.*"), inexistente);

        String semTelefone = resposta(ADMIN, "telefone do professor Pedro");
        assertTrue(semTelefone.contains("não há telefone registrado"), semTelefone);

        String ambiguo = resposta(ADMIN, "telefone do professor Silva");
        assertTrue(ambiguo.contains("Joao Silva") && ambiguo.contains("Joana Silva"), ambiguo);
        assertFalse(ambiguo.contains("91111") || ambiguo.contains("93333"), ambiguo);

        String semNome = resposta(ADMIN, "qual o telefone do professor?");
        assertTrue(semNome.contains("De quem"), semNome);
    }

    @Test
    @Order(5)
    void professorSoVeOProprioTelefone() throws Exception {

        String deColega = resposta(JOAO, "telefone da professora Maria Souza");
        assertTrue(deColega.contains("só pode consultar o próprio telefone"), deColega);
        assertFalse(deColega.contains("92222"), deColega);

        String proprio = resposta(JOAO, "qual é o meu telefone?");
        assertTrue(proprio.contains("11 91111-1111"), proprio);

        String proprioPorNome = resposta(JOAO, "telefone do professor Joao Silva");
        assertTrue(proprioPorNome.contains("11 91111-1111"), proprioPorNome);
    }

    @Test
    @Order(6)
    void nuncaExpoeCpfOuEndereco() throws Exception {
        String r = resposta(ADMIN, "telefone do professor Maria Souza e o cpf dela");
        assertFalse(r.contains("444"), r);
    }

    @Test
    @Order(7)
    void professorNaoAlteraConfiguracoes() throws Exception {

        MockHttpServletResponse r = perguntar(JOAO, "mude a cor do sistema para escuro");
        assertEquals(200, r.getStatus());
        assertTrue(((String) JsonPath.read(corpo(r), "$.resposta"))
                .contains("não tem permissão"), corpo(r));
        assertFalse(corpo(r).contains("acaoPendente"), corpo(r));

        assertTrue(corpo(enviar(get("/edu/config/geral"), JOAO, null))
                .contains("\"aparencia\":\"auto\""));
    }

    @Test
    @Order(8)
    void aparenciaExigeConfirmacaoEPersisteGerandoNotificacao() throws Exception {

        String antes = corpo(enviar(get("/edu/notificacoes"), ADMIN, null));
        assertFalse(antes.contains("Aparência alterada"), antes);

        MockHttpServletResponse proposta =
                perguntar(ADMIN, "Pode mudar a cor do sistema para o modo escuro?");
        assertEquals(200, proposta.getStatus(), corpo(proposta));

        String json = corpo(proposta);
        assertEquals("ALTERAR_APARENCIA", JsonPath.read(json, "$.acaoPendente.tipo"));
        assertEquals("escuro", JsonPath.read(json, "$.acaoPendente.parametros.aparencia"));
        assertNotNull(JsonPath.read(json, "$.acaoPendente.expiraEm"));
        String id = JsonPath.read(json, "$.acaoPendente.id");

        // Passo 1 não altera nada.
        assertTrue(corpo(enviar(get("/edu/config/geral"), ADMIN, null))
                .contains("\"aparencia\":\"auto\""));

        // Outro usuário não consegue confirmar a ação de terceiros.
        assertEquals(404, enviar(post("/api/ia/acoes/" + id + "/confirmar"),
                FUNC, null).getStatus());

        MockHttpServletResponse confirmada =
                enviar(post("/api/ia/acoes/" + id + "/confirmar"), ADMIN, null);
        assertEquals(200, confirmada.getStatus(), corpo(confirmada));
        assertEquals("ALTERAR_APARENCIA",
                JsonPath.read(corpo(confirmada), "$.acaoExecutada.tipo"));
        assertEquals("escuro",
                JsonPath.read(corpo(confirmada), "$.acaoExecutada.parametros.aparencia"));

        assertTrue(corpo(enviar(get("/edu/config/geral"), ADMIN, null))
                .contains("\"aparencia\":\"escuro\""));
        assertTrue(corpo(enviar(get("/edu/notificacoes"), ADMIN, null))
                .contains("Aparência alterada"));

        // Uso único.
        assertEquals(404, enviar(post("/api/ia/acoes/" + id + "/confirmar"),
                ADMIN, null).getStatus());

        assertTrue(resposta(JOAO, "qual a aparência atual do sistema?")
                .contains("escuro"));
    }

    @Test
    @Order(9)
    void cancelarNaoAlteraNada() throws Exception {

        String json = corpo(perguntar(ADMIN, "troque o tema para claro"));
        String id = JsonPath.read(json, "$.acaoPendente.id");

        MockHttpServletResponse r =
                enviar(post("/api/ia/acoes/" + id + "/cancelar"), ADMIN, null);
        assertEquals(200, r.getStatus());
        assertFalse(corpo(r).contains("acaoExecutada"), corpo(r));

        assertTrue(corpo(enviar(get("/edu/config/geral"), ADMIN, null))
                .contains("\"aparencia\":\"escuro\""));

        assertEquals(404, enviar(post("/api/ia/acoes/" + id + "/confirmar"),
                ADMIN, null).getStatus());
    }

    @Test
    @Order(10)
    void mesmoValorOuValorInvalidoNaoGeraAcao() throws Exception {

        String igual = corpo(perguntar(ADMIN, "mude a aparência para escuro"));
        assertFalse(igual.contains("acaoPendente"), igual);
        assertTrue(igual.contains("Nada a alterar"), igual);

        String cor = corpo(perguntar(ADMIN, "mude a cor do sistema para azul"));
        assertFalse(cor.contains("acaoPendente"), cor);
        assertTrue(cor.contains("claro") && cor.contains("escuro"), cor);
    }

    @Test
    @Order(11)
    void notificacaoConfirmadaPorTextoNoChat() throws Exception {

        String json = corpo(perguntar(ADMIN, "desative as notificações de faltas e atrasos"));
        assertEquals("ALTERAR_NOTIFICACAO", JsonPath.read(json, "$.acaoPendente.tipo"));
        assertEquals("faltasAtrasos", JsonPath.read(json, "$.acaoPendente.parametros.campo"));

        assertTrue(corpo(enviar(get("/edu/config/notificacoes"), ADMIN, null))
                .contains("\"faltasAtrasos\":true"));

        MockHttpServletResponse sim = perguntar(ADMIN, "sim");
        assertEquals(200, sim.getStatus(), corpo(sim));
        assertEquals("ALTERAR_NOTIFICACAO",
                JsonPath.read(corpo(sim), "$.acaoExecutada.tipo"));

        String config = corpo(enviar(get("/edu/config/notificacoes"), ADMIN, null));
        assertTrue(config.contains("\"faltasAtrasos\":false"), config);
        // Os demais campos não mudam.
        assertTrue(config.contains("\"alunosEmRisco\":true"), config);

        verify(gemini, never()).gerarResposta(anyString(), anyString());
    }

    @Test
    @Order(12)
    void professorNaoAlteraNotificacoes() throws Exception {
        String r = corpo(perguntar(JOAO, "ative os relatórios por e-mail"));
        assertFalse(r.contains("acaoPendente"), r);
        assertTrue(r.contains("não tem permissão"), r);
    }

    @Test
    @Order(13)
    void conversaLivreVaiParaOGeminiEFalhaViraErroClaro() throws Exception {

        when(gemini.gerarResposta(eq("Qual a situação geral da escola?"), anyString()))
                .thenReturn("Resposta do modelo");

        assertEquals("Resposta do modelo",
                resposta(ADMIN, "Qual a situação geral da escola?"));

        when(gemini.gerarResposta(eq("outra pergunta"), anyString()))
                .thenThrow(new RuntimeException("sem chave"));

        MockHttpServletResponse indisponivel = perguntar(ADMIN, "outra pergunta");
        assertEquals(503, indisponivel.getStatus());
        assertTrue(corpo(indisponivel).contains("GEMINI_API_KEY"));
    }

    @Test
    @Order(14)
    void contratoAntigoEProtecao() throws Exception {

        assertEquals(401, perguntar(null, "oi").getStatus());
        assertEquals(400, enviar(post("/api/ia/perguntar"), ADMIN,
                "{\"pergunta\":\"  \"}").getStatus());

        // Resposta simples continua só com "resposta" (sem campos de ação).
        String r = corpo(perguntar(ADMIN, "quantos professores"));
        assertTrue(r.startsWith("{\"resposta\":"), r);
        assertFalse(r.contains("acao"), r);
    }

    @Test
    @Order(15)
    void contaAlunosTurmasSalasEPresencaDeHojeComDadosReais() throws Exception {

        String vazio = resposta(ADMIN, "quantos alunos estão presentes hoje?");
        assertTrue(vazio.contains("Não há registros de frequência para hoje"), vazio);

        assertEquals("Turma cadastrada com sucesso!", corpo(enviar(post("/edu/cadturma"), ADMIN,
                "{\"nome\":\"1A\",\"curso\":\"Informática\",\"turno\":\"Matutino\"}")));
        assertEquals("Sala cadastrada", corpo(enviar(post("/edu/cadsala"), ADMIN,
                "{\"numero\":10,\"capacidade\":30,\"andar\":\"1\"}")));

        for (String[] a : new String[][]{{"Ana", "M001", "AA11BB22"}, {"Bruno", "M002", "CC33DD44"}}) {
            assertEquals("Aluno cadastrado!!", corpo(enviar(post("/edu/cadsaln"), ADMIN,
                    "{\"nome\":\"" + a[0] + "\",\"matricula\":\"" + a[1]
                            + "\",\"turmaId\":1,\"turno\":\"Matutino\",\"cartao\":{\"uid\":\""
                            + a[2] + "\",\"ativo\":true}}")));
        }

        String hoje = java.time.LocalDate.now(
                java.time.ZoneId.of("America/Sao_Paulo")).toString();

        assertEquals("Registro salvo com sucesso!!", corpo(enviar(post("/edu/manual"), ADMIN,
                "{\"alunoId\":1,\"data\":\"" + hoje + "\",\"horario\":\"07:00:00\",\"status\":\"PRESENTE\"}")));

        String contagem = resposta(JOAO, "Quantos alunos, turmas e salas temos?");
        assertTrue(contagem.contains("2 alunos") && contagem.contains("1 turma")
                && contagem.contains("1 sala"), contagem);

        String presenca = resposta(FUNC, "Quantos alunos vieram hoje? Quantos presentes hoje?");
        assertTrue(presenca.contains("Presentes: 1") && presenca.contains("faltas: 0"), presenca);

        verify(gemini, never()).gerarResposta(anyString(), anyString());
    }

    @Test
    @Order(16)
    void sugestoesRapidasRespondemComBaseDeConhecimentoReal() throws Exception {

        String sistema = resposta(JOAO, "Como funciona o EduControl?");
        assertTrue(sistema.contains("Início") && sistema.contains("Presenças")
                && sistema.contains("Relatórios"), sistema);

        String presenca = resposta(JOAO, "Como funciona o controle de presença?");
        assertTrue(presenca.contains("RFID") && presenca.contains("Registrar presença"), presenca);

        String relatorio = resposta(ADMIN, "Como gerar um relatório?");
        assertTrue(relatorio.contains("Gerar relatório") && relatorio.contains("PDF"), relatorio);

        String ajudaProfessor = resposta(JOAO, "O que posso perguntar para você?");
        assertTrue(ajudaProfessor.contains("só o seu próprio telefone"), ajudaProfessor);

        String ajudaAdmin = resposta(ADMIN, "O que posso perguntar para você?");
        assertTrue(ajudaAdmin.contains("mude a aparência"), ajudaAdmin);

        verify(gemini, never()).gerarResposta(anyString(), anyString());
    }

    @Test
    @Order(17)
    void perguntaSobreOSiteForaDasRespostasFixasVaiParaOGeminiComPerfil() throws Exception {

        when(gemini.gerarResposta(eq("O sistema tem tela de boletim?"), eq("PROFESSOR")))
                .thenReturn("Não consta boletim no EduControl.");

        assertEquals("Não consta boletim no EduControl.",
                resposta(JOAO, "O sistema tem tela de boletim?"));
    }
}
