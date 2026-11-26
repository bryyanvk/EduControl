package com.tcc.back_end.ia.Service;

import com.tcc.back_end.DTO.ConfNotificacaoRequestDTO;
import com.tcc.back_end.DTO.ConfNotificacaoResponseDTO;
import com.tcc.back_end.DTO.ConfiguracaoGeralRequestDTO;
import com.tcc.back_end.DTO.ConfiguracaoGeralResponseDTO;
import com.tcc.back_end.DTO.TeamResponseDTO;
import com.tcc.back_end.Model.Enum.TipoAcesso;
import com.tcc.back_end.Service.ConfiguracaoService;
import com.tcc.back_end.Service.TeamService;
import com.tcc.back_end.Service.AlunoService;
import com.tcc.back_end.Service.PresencaService;
import com.tcc.back_end.Service.SalaService;
import com.tcc.back_end.Service.TurmaService;
import com.tcc.back_end.DTO.PresencaResponseDTO;
import com.tcc.back_end.ia.Model.AcaoPendente;
import com.tcc.back_end.ia.Model.TipoAcaoIA;
import com.tcc.back_end.ia.Model.UsuarioIA;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Ferramentas da IA: tudo aqui consulta ou altera os services reais.
 * Nada é inventado: sem dado, a resposta diz que não encontrou.
 */
@Service
public class FerramentasIAService {

    public static final Map<String, String> ROTULOS_NOTIFICACAO = rotulos();

    private static Map<String, String> rotulos() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("notificacoesSistema", "notificações do sistema");
        m.put("faltasAtrasos", "alertas de faltas e atrasos");
        m.put("alunosEmRisco", "alertas de alunos em risco");
        m.put("novosAlunos", "avisos de novos alunos");
        m.put("professoresAusentes", "alertas de professores ausentes");
        m.put("relatoriosEmail", "relatórios por e-mail");
        return m;
    }

    private final TeamService teamService;
    private final ConfiguracaoService configuracaoService;
    private final AlunoService alunoService;
    private final TurmaService turmaService;
    private final SalaService salaService;
    private final PresencaService presencaService;

    public FerramentasIAService(
            TeamService teamService,
            ConfiguracaoService configuracaoService,
            AlunoService alunoService,
            TurmaService turmaService,
            SalaService salaService,
            PresencaService presencaService) {

        this.teamService = teamService;
        this.configuracaoService = configuracaoService;
        this.alunoService = alunoService;
        this.turmaService = turmaService;
        this.salaService = salaService;
        this.presencaService = presencaService;
    }

    // ------------------------------------------------------------------
    // Consultas
    // ------------------------------------------------------------------

    /**
     * Contagens reais (dados agregados, todos os perfis): equipe por tipoAcesso,
     * alunos, turmas e salas.
     */
    public String contarDados(List<String> categorias) {

        List<String> partes = new ArrayList<>();

        List<TeamResponseDTO> equipe = null;

        for (String categoria : categorias) {

            switch (categoria) {
                case "ALUNOS" -> {
                    int n = tamanho(alunoService.getListaDeAlunos());
                    partes.add(n + (n == 1 ? " aluno" : " alunos"));
                }
                case "TURMAS" -> {
                    int n = tamanho(turmaService.getListaDeTurma());
                    partes.add(n + (n == 1 ? " turma" : " turmas"));
                }
                case "SALAS" -> {
                    int n = tamanho(salaService.getListaDeSala());
                    partes.add(n + (n == 1 ? " sala" : " salas"));
                }
                default -> {
                    if (equipe == null) {
                        equipe = teamService.getListaTeam();
                    }

                    TipoAcesso tipo = TipoAcesso.valueOf(categoria);
                    List<TeamResponseDTO> lista = equipe;

                    long total = lista.stream()
                            .filter(m -> m.getTipoAcesso() == tipo).count();
                    long ativos = lista.stream()
                            .filter(m -> m.getTipoAcesso() == tipo
                                    && m.isAcessoAtivo()).count();

                    partes.add(total + " " + rotuloPlural(tipo, total)
                            + " (" + ativos + " com acesso ativo)");
                }
            }
        }

        return "Segundo os cadastros do sistema, há "
                + String.join("; ", partes) + ".";
    }

    /** Frequência de hoje, direto dos registros reais. */
    public String presencaHoje() {

        java.time.LocalDate hoje = java.time.LocalDate.now(
                java.time.ZoneId.of("America/Sao_Paulo"));

        List<PresencaResponseDTO> registros = presencaService.getListaRegistro();

        List<PresencaResponseDTO> deHoje = registros == null ? List.of()
                : registros.stream()
                .filter(r -> r.getData() != null && hoje.equals(r.getData()))
                .toList();

        if (deHoje.isEmpty()) {
            return "Não há registros de frequência para hoje ("
                    + hoje.format(java.time.format.DateTimeFormatter
                    .ofPattern("dd/MM/yyyy"))
                    + "). Isso não significa que alguém faltou: "
                    + "ainda não houve registro.";
        }

        Map<String, Long> contagem = new LinkedHashMap<>();

        for (String status : List.of("PRESENTE", "ATRASADO", "JUSTIFICADO",
                "FALTA", "PENDENTE")) {
            contagem.put(status, deHoje.stream()
                    .filter(r -> r.getStatus() != null
                            && r.getStatus().name().equals(status))
                    .count());
        }

        return "Registros de hoje (" + hoje.format(
                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + "): " + deHoje.size() + " no total. "
                + "Presentes: " + contagem.get("PRESENTE")
                + "; atrasados: " + contagem.get("ATRASADO")
                + "; justificados: " + contagem.get("JUSTIFICADO")
                + "; faltas: " + contagem.get("FALTA")
                + "; pendentes: " + contagem.get("PENDENTE") + ".";
    }

    private static int tamanho(java.util.Collection<?> lista) {
        return lista == null ? 0 : lista.size();
    }

    public String telefoneDe(UsuarioIA usuario, String nomeBuscado,
                             boolean proprio) {

        if (proprio) {
            TeamResponseDTO eu = teamService.buscarTeamPorId(usuario.id());
            return respostaTelefone(eu, "você");
        }

        if (nomeBuscado == null || nomeBuscado.isBlank()) {
            return "De quem você quer o telefone? Informe o nome do professor "
                    + "ou funcionário.";
        }

        List<TeamResponseDTO> encontrados = buscarPorNome(nomeBuscado);

        if (encontrados.isEmpty()) {
            return "Não encontrei ninguém da equipe com o nome \""
                    + nomeBuscado + "\" nos cadastros.";
        }

        if (encontrados.size() > 1) {

            // Sem telefone aqui: só os nomes, para o usuário especificar.
            List<String> nomes = encontrados.stream()
                    .map(m -> m.getNome() + " (" + rotuloSingular(m.getTipoAcesso()) + ")")
                    .toList();

            return "Encontrei mais de uma pessoa: " + String.join(", ", nomes)
                    + ". Informe o nome completo de quem você procura.";
        }

        TeamResponseDTO alvo = encontrados.get(0);

        if (!PermissoesIA.podeVerTelefone(usuario, alvo)) {
            return "Seu perfil (" + rotuloSingular(usuario.tipoAcesso())
                    + ") só pode consultar o próprio telefone. Para contatos "
                    + "de outros membros da equipe, procure a secretaria.";
        }

        return respostaTelefone(alvo, alvo.getNome()
                + " (" + rotuloSingular(alvo.getTipoAcesso()) + ")");
    }

    public String consultarAparencia() {

        ConfiguracaoGeralResponseDTO geral =
                configuracaoService.buscarConfiguracaoGeral();

        if (geral == null || geral.getAparencia() == null) {
            return "Não encontrei a configuração de aparência do sistema.";
        }

        return "A aparência do sistema está em \""
                + rotuloAparencia(geral.getAparencia()) + "\".";
    }

    // ------------------------------------------------------------------
    // Alterações (passo 1: propor)
    // ------------------------------------------------------------------

    /** Valida e devolve a proposta; null em "mensagem" significa que há proposta. */
    public record Proposta(
            String mensagem,
            TipoAcaoIA tipo,
            String descricao,
            Map<String, Object> parametros) {

        public boolean valida() {
            return tipo != null;
        }

        static Proposta recusa(String mensagem) {
            return new Proposta(mensagem, null, null, null);
        }
    }

    public Proposta proporAparencia(UsuarioIA usuario, String valor) {

        if (!PermissoesIA.podeAlterarConfiguracoes(usuario)) {
            return Proposta.recusa("Seu perfil ("
                    + rotuloSingular(usuario.tipoAcesso())
                    + ") não tem permissão para alterar configurações do "
                    + "sistema. Peça a um administrador.");
        }

        if (valor == null) {
            return Proposta.recusa("O sistema só aceita as aparências "
                    + "\"claro\", \"escuro\" e \"automático\" (segue o "
                    + "sistema). Qual delas você quer?");
        }

        ConfiguracaoGeralResponseDTO atual =
                configuracaoService.buscarConfiguracaoGeral();

        if (atual != null && valor.equals(atual.getAparencia())) {
            return Proposta.recusa("A aparência já está em \""
                    + rotuloAparencia(valor) + "\". Nada a alterar.");
        }

        String de = atual == null || atual.getAparencia() == null
                ? "não definida" : rotuloAparencia(atual.getAparencia());

        Map<String, Object> parametros = new LinkedHashMap<>();
        parametros.put("aparencia", valor);

        return new Proposta(null, TipoAcaoIA.ALTERAR_APARENCIA,
                "Alterar a aparência do sistema de \"" + de + "\" para \""
                        + rotuloAparencia(valor) + "\". Vale para todos os "
                        + "usuários e gera uma notificação de mudança.",
                parametros);
    }

    public Proposta proporNotificacao(UsuarioIA usuario, String campo,
                                      Boolean ligar) {

        if (!PermissoesIA.podeAlterarConfiguracoes(usuario)) {
            return Proposta.recusa("Seu perfil ("
                    + rotuloSingular(usuario.tipoAcesso())
                    + ") não tem permissão para alterar configurações do "
                    + "sistema. Peça a um administrador.");
        }

        if (campo == null || !ROTULOS_NOTIFICACAO.containsKey(campo)) {
            return Proposta.recusa("Qual notificação você quer alterar? "
                    + "Opções: " + String.join(", ",
                    ROTULOS_NOTIFICACAO.values()) + ".");
        }

        ConfNotificacaoResponseDTO atual =
                configuracaoService.buscarNotificacoes();

        if (atual == null) {
            return Proposta.recusa("Não encontrei a configuração de "
                    + "notificações do sistema.");
        }

        if (lerCampo(atual, campo) == ligar) {
            return Proposta.recusa("As " + ROTULOS_NOTIFICACAO.get(campo)
                    + " já estão " + (ligar ? "ativadas" : "desativadas")
                    + ". Nada a alterar.");
        }

        Map<String, Object> parametros = new LinkedHashMap<>();
        parametros.put("campo", campo);
        parametros.put("valor", ligar);

        return new Proposta(null, TipoAcaoIA.ALTERAR_NOTIFICACAO,
                (ligar ? "Ativar" : "Desativar") + " as "
                        + ROTULOS_NOTIFICACAO.get(campo)
                        + ". Vale para todo o sistema.",
                parametros);
    }

    // ------------------------------------------------------------------
    // Alterações (passo 2: executar após confirmação)
    // ------------------------------------------------------------------

    /**
     * Executa a ação confirmada pelos services reais. As permissões são
     * conferidas de novo aqui, na hora de executar.
     */
    public String executar(UsuarioIA usuario, AcaoPendente acao) {

        if (!PermissoesIA.podeAlterarConfiguracoes(usuario)) {
            throw new SecurityException("Sem permissão para alterar configurações.");
        }

        return switch (acao.tipo()) {
            case ALTERAR_APARENCIA -> executarAparencia(
                    (String) acao.parametros().get("aparencia"));
            case ALTERAR_NOTIFICACAO -> executarNotificacao(
                    (String) acao.parametros().get("campo"),
                    (Boolean) acao.parametros().get("valor"));
        };
    }

    private String executarAparencia(String valor) {

        ConfiguracaoGeralResponseDTO atual =
                configuracaoService.buscarConfiguracaoGeral();

        ConfiguracaoGeralRequestDTO dto = new ConfiguracaoGeralRequestDTO();
        dto.setAparencia(valor);
        // Preserva o idioma já configurado.
        dto.setIdioma(atual != null && atual.getIdioma() != null
                ? atual.getIdioma() : "pt-BR");

        // O próprio service registra a notificação "Aparência alterada".
        String resultado = configuracaoService.salvarConfiguracaoGeral(dto);

        if (!resultado.contains("sucesso")) {
            throw new IllegalStateException(resultado);
        }

        return "Pronto! A aparência do sistema agora está em \""
                + rotuloAparencia(valor) + "\" e a notificação da mudança "
                + "foi registrada.";
    }

    private String executarNotificacao(String campo, Boolean valor) {

        ConfNotificacaoResponseDTO atual =
                configuracaoService.buscarNotificacoes();

        if (atual == null) {
            throw new IllegalStateException(
                    "Configuração de notificações não encontrada.");
        }

        ConfNotificacaoRequestDTO dto = new ConfNotificacaoRequestDTO();
        dto.setNotificacoesSistema(atual.isNotificacoesSistema());
        dto.setFaltasAtrasos(atual.isFaltasAtrasos());
        dto.setAlunosEmRisco(atual.isAlunosEmRisco());
        dto.setNovosAlunos(atual.isNovosAlunos());
        dto.setProfessoresAusentes(atual.isProfessoresAusentes());
        dto.setRelatoriosEmail(atual.isRelatoriosEmail());

        switch (campo) {
            case "notificacoesSistema" -> dto.setNotificacoesSistema(valor);
            case "faltasAtrasos" -> dto.setFaltasAtrasos(valor);
            case "alunosEmRisco" -> dto.setAlunosEmRisco(valor);
            case "novosAlunos" -> dto.setNovosAlunos(valor);
            case "professoresAusentes" -> dto.setProfessoresAusentes(valor);
            case "relatoriosEmail" -> dto.setRelatoriosEmail(valor);
            default -> throw new IllegalStateException(
                    "Notificação desconhecida: " + campo);
        }

        String resultado = configuracaoService.salvarNotificacoes(dto);

        if (!resultado.contains("sucesso")) {
            throw new IllegalStateException(resultado);
        }

        return "Pronto! As " + ROTULOS_NOTIFICACAO.get(campo) + " foram "
                + (valor ? "ativadas" : "desativadas") + ".";
    }

    // ------------------------------------------------------------------
    // Utilidades
    // ------------------------------------------------------------------

    private boolean lerCampo(ConfNotificacaoResponseDTO c, String campo) {
        return switch (campo) {
            case "notificacoesSistema" -> c.isNotificacoesSistema();
            case "faltasAtrasos" -> c.isFaltasAtrasos();
            case "alunosEmRisco" -> c.isAlunosEmRisco();
            case "novosAlunos" -> c.isNovosAlunos();
            case "professoresAusentes" -> c.isProfessoresAusentes();
            case "relatoriosEmail" -> c.isRelatoriosEmail();
            default -> false;
        };
    }

    private String respostaTelefone(TeamResponseDTO membro, String quem) {

        if (membro == null) {
            return "Não encontrei esse cadastro no sistema.";
        }

        if (membro.getTelefone() == null || membro.getTelefone().isBlank()) {
            return "Encontrei o cadastro de " + quem
                    + ", mas não há telefone registrado.";
        }

        return "O telefone cadastrado de " + quem + " é "
                + membro.getTelefone() + ".";
    }

    private List<TeamResponseDTO> buscarPorNome(String nomeBuscado) {

        String[] tokensBusca =
                RoteadorIntencaoService.normalizar(nomeBuscado).split(" ");

        List<TeamResponseDTO> candidatos = new ArrayList<>();

        for (TeamResponseDTO membro : teamService.getListaTeam()) {

            if (membro.getNome() == null) {
                continue;
            }

            String[] tokensNome =
                    RoteadorIntencaoService.normalizar(membro.getNome()).split(" ");

            boolean todos = true;

            for (String busca : tokensBusca) {

                boolean achou = false;

                for (String token : tokensNome) {
                    if (token.startsWith(busca)) {
                        achou = true;
                        break;
                    }
                }

                if (!achou) {
                    todos = false;
                    break;
                }
            }

            if (todos) {
                candidatos.add(membro);
            }
        }

        // Nome completo exato desfaz a ambiguidade.
        String completo = RoteadorIntencaoService.normalizar(nomeBuscado);

        List<TeamResponseDTO> exatos = candidatos.stream()
                .filter(m -> RoteadorIntencaoService.normalizar(m.getNome())
                        .equals(completo))
                .toList();

        return exatos.size() == 1 ? exatos : candidatos;
    }

    public static String rotuloAparencia(String valor) {
        return switch (valor) {
            case "claro" -> "claro";
            case "escuro" -> "escuro";
            case "auto" -> "automático";
            default -> valor;
        };
    }

    private static String rotuloSingular(TipoAcesso tipo) {
        if (tipo == null) {
            return "sem perfil";
        }

        return switch (tipo) {
            case PROFESSOR -> "professor";
            case FUNCIONARIO -> "funcionário";
            case ADMINISTRADOR -> "administrador";
        };
    }

    private static String rotuloPlural(TipoAcesso tipo, long quantidade) {

        return switch (tipo) {
            case PROFESSOR -> quantidade == 1 ? "professor" : "professores";
            case FUNCIONARIO -> quantidade == 1 ? "funcionário" : "funcionários";
            case ADMINISTRADOR -> quantidade == 1 ? "administrador" : "administradores";
        };
    }
}
