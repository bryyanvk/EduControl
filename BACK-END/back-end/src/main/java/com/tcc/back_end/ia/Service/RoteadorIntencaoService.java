package com.tcc.back_end.ia.Service;

import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Roteador de intenções simples e determinístico. O que mexe em dados reais
 * ou em configurações NÃO depende do modelo: o texto é interpretado aqui e a
 * resposta vem dos services. O que não casar vai para o Gemini (conversa livre).
 */
@Service
public class RoteadorIntencaoService {

    public enum Tipo {
        CONFIRMAR,
        CANCELAR,
        CONTAR_DADOS,
        PRESENCA_HOJE,
        CONHECIMENTO,
        TELEFONE,
        CONSULTAR_APARENCIA,
        ALTERAR_APARENCIA,
        ALTERAR_NOTIFICACAO,
        LIVRE
    }

    /**
     * categorias: PROFESSOR / FUNCIONARIO / ADMINISTRADOR / ALUNOS / TURMAS / SALAS (CONTAR_DADOS).
     * CONHECIMENTO: "valor" é a chave da seção da base de conhecimento.
     * nome: nome procurado (TELEFONE); vazio = o próprio usuário.
     * valor: claro/escuro/auto (ALTERAR_APARENCIA; null = valor não reconhecido).
     * campo/ligar: notificação e novo estado (ALTERAR_NOTIFICACAO; campo null = não informado).
     */
    public record Intencao(
            Tipo tipo,
            List<String> categorias,
            String nome,
            String valor,
            String campo,
            Boolean ligar
    ) {
        static Intencao de(Tipo tipo) {
            return new Intencao(tipo, List.of(), null, null, null, null);
        }
    }

    private static final Set<String> PALAVRAS_NOME_IGNORADAS = Set.of(
            "o", "a", "os", "as", "do", "da", "de", "dos", "das", "e",
            "professor", "professora", "prof", "funcionario", "funcionaria",
            "administrador", "administradora", "pro", "por", "favor",
            "qual", "quais", "me", "diga", "fale", "informe", "passe",
            "numero", "telefone", "celular", "contato", "fone", "whatsapp",
            "zap", "tem", "esta", "eh", "que", "ai", "pra", "para", "do(a)",
            "equipe", "sistema", "escola");

    private static final Pattern CONFIRMAR = Pattern.compile(
            "^(sim|s|confirmo|confirmar|confirma|pode|pode sim|pode confirmar|"
                    + "pode alterar|pode fazer|ok|okay|isso|isso mesmo|"
                    + "sim confirmo|sim pode)$");

    private static final Pattern CANCELAR = Pattern.compile(
            "^(nao|n|cancelar|cancela|cancele|nao confirmo|nao quero|"
                    + "deixa pra la|deixa|esquece|esqueca|melhor nao)$");

    private static final Pattern PEDE_TELEFONE = Pattern.compile(
            "\\b(telefone|celular|whatsapp|zap|fone|contato)\\b"
                    + "|\\bnumero (do|da|dele|dela)\\b");

    private static final Pattern PEDE_CONTAGEM = Pattern.compile(
            "\\b(quantos|quantas|quantidade|total|numero de|qtd)\\b");

    private static final Pattern VERBO_ALTERAR = Pattern.compile(
            "\\b(mude|mudar|muda|altere|alterar|altera|troque|trocar|troca|"
                    + "coloque|colocar|coloca|ative|ativar|ativa|deixe|deixar|"
                    + "deixa|passe|passar|configure|configurar|ponha|"
                    + "poe|defina|definir|habilite|habilitar)\\b");

    private static final Pattern VERBO_LIGAR = Pattern.compile(
            "\\b(ative|ativar|ativa|ligue|ligar|liga|habilite|habilitar|"
                    + "habilita|receber|quero receber)\\b");

    private static final Pattern VERBO_DESLIGAR = Pattern.compile(
            "\\b(desative|desativar|desativa|desligue|desligar|desliga|"
                    + "desabilite|desabilitar|desabilita|pare|parar|"
                    + "nao quero receber|nao receber|silencie|silenciar)\\b");

    public Intencao interpretar(String pergunta, boolean haAcaoPendente) {

        String t = normalizar(pergunta);

        if (t.isEmpty()) {
            return Intencao.de(Tipo.LIVRE);
        }

        if (haAcaoPendente) {
            if (CONFIRMAR.matcher(t).matches()) {
                return Intencao.de(Tipo.CONFIRMAR);
            }

            if (CANCELAR.matcher(t).matches()) {
                return Intencao.de(Tipo.CANCELAR);
            }
        }

        // 1) Telefone (antes da contagem: "numero do professor Fulano").
        if (PEDE_TELEFONE.matcher(t).find()) {
            boolean proprio = t.matches(".*\\b(meu|minha)\\b.*");

            return new Intencao(Tipo.TELEFONE, List.of(),
                    proprio ? "" : extrairNome(t),
                    proprio ? "PROPRIO" : null, null, null);
        }

        // 2) Notificações (alteração).
        if (t.contains("notifica") || t.contains("alerta")
                || t.contains("aviso") || t.contains("relatorio")) {

            boolean liga = VERBO_LIGAR.matcher(t).find();
            boolean desliga = VERBO_DESLIGAR.matcher(t).find();

            if (liga != desliga) {
                return new Intencao(Tipo.ALTERAR_NOTIFICACAO, List.of(), null,
                        null, campoNotificacao(t), liga);
            }
        }

        // 3) Aparência / cor / tema. Só age com verbo de alteração explícito.
        boolean falaAparencia = t.matches(
                ".*\\b(cor|cores|tema|aparencia|visual|modo escuro|modo claro)\\b.*");
        String valor = valorAparencia(t);

        if (falaAparencia) {

            boolean altera = VERBO_ALTERAR.matcher(t).find();

            boolean consulta = !altera && t.matches(
                    ".*\\b(qual|quais|como esta|atual|atualmente)\\b.*");

            if (consulta) {
                return Intencao.de(Tipo.CONSULTAR_APARENCIA);
            }

            if (altera) {
                return new Intencao(Tipo.ALTERAR_APARENCIA, List.of(), null,
                        valor, null, null);
            }
        }

        // 4) Presença de hoje (dado real do dia).
        if (t.matches(".*\\bhoje\\b.*")
                && t.matches(".*\\b(presente|presentes|presenca|presencas|falta|faltas|faltou|faltaram|atrasado|atrasados|atrasaram|ausente|ausentes|justificado|justificados|frequencia)\\b.*")) {
            return Intencao.de(Tipo.PRESENCA_HOJE);
        }

        // 5) Contagens de dados reais (equipe, alunos, turmas, salas).
        if (PEDE_CONTAGEM.matcher(t).find()
                || t.matches(".*\\b(quantos|quantas)\\b.*")) {

            List<String> categorias = categorias(t);

            if (!categorias.isEmpty()) {
                return new Intencao(Tipo.CONTAR_DADOS, categorias,
                        null, null, null, null);
            }
        }

        // 6) Perguntas sobre o sistema, respondidas pela base de conhecimento.
        String chave = chaveConhecimento(t);

        if (chave != null) {
            return new Intencao(Tipo.CONHECIMENTO, List.of(), null,
                    chave, null, null);
        }

        return Intencao.de(Tipo.LIVRE);
    }

    private List<String> categorias(String t) {

        java.util.ArrayList<String> lista = new java.util.ArrayList<>();

        if (t.matches(".*\\b(professor|professores|professora|professoras|docente|docentes)\\b.*")) {
            lista.add("PROFESSOR");
        }

        if (t.matches(".*\\b(funcionario|funcionarios|funcionaria|funcionarias|secretaria|secretarios)\\b.*")) {
            lista.add("FUNCIONARIO");
        }

        if (t.matches(".*\\b(administrador|administradores|administradora|admin|admins|gestor|gestores)\\b.*")) {
            lista.add("ADMINISTRADOR");
        }

        if (t.matches(".*\\b(aluno|alunos|estudante|estudantes)\\b.*")) {
            lista.add("ALUNOS");
        }

        if (t.matches(".*\\b(turma|turmas)\\b.*")) {
            lista.add("TURMAS");
        }

        if (t.matches(".*\\b(sala|salas)\\b.*")) {
            lista.add("SALAS");
        }

        if (lista.isEmpty()
                && t.matches(".*\\b(equipe|colaboradores|usuarios|pessoas|profissionais)\\b.*")) {
            lista.addAll(List.of("PROFESSOR", "FUNCIONARIO", "ADMINISTRADOR"));
        }

        return lista;
    }

    /** Só as perguntas de "como funciona / o que posso perguntar" conhecidas. */
    private String chaveConhecimento(String t) {

        if (t.matches(".*\\b(o que (eu )?posso (te |lhe )?perguntar|o que voce (faz|pode)|como (voce )?(pode|vai) me ajudar|como voce pode ajudar|quais (sao )?(as )?(suas )?funcoes)\\b.*")) {
            return "AJUDA";
        }

        if (t.matches(".*\\b(presenca|presencas|frequencia|rfid|cartao)\\b.*")
                && t.matches(".*\\b(como|funciona|funcionam|registrar|registro|registra|lancar|marcar|controle)\\b.*")) {
            return "PRESENCA";
        }

        if (t.contains("relatorio")
                && t.matches(".*\\b(como|gerar|gero|emitir|exportar|baixar|funciona)\\b.*")) {
            return "RELATORIOS";
        }

        if (t.matches(".*\\b(como funciona|o que e|para que serve|pra que serve|explique|explica)\\b.*(educontrol|sistema|site)\\b.*")
                || t.matches(".*\\b(educontrol|sistema|site)\\b.*\\b(como funciona|o que e|para que serve)\\b.*")) {
            return "VISAO_GERAL";
        }

        if (t.matches(".*\\b(perfis|permissoes|permissao)\\b.*")
                && t.matches(".*\\b(como|quais|o que|pode)\\b.*")) {
            return "PERFIS";
        }

        return null;
    }

    private String valorAparencia(String t) {

        if (t.matches(".*\\b(escuro|escura|dark|noturno|noite|preto|preta)\\b.*")) {
            return "escuro";
        }

        if (t.matches(".*\\b(claro|clara|light|branco|branca|diurno)\\b.*")) {
            return "claro";
        }

        if (t.matches(".*\\b(automatico|automatica|auto|sistema operacional|padrao)\\b.*")) {
            return "auto";
        }

        return null;
    }

    private String campoNotificacao(String t) {

        if (t.matches(".*\\b(falta|faltas|atraso|atrasos)\\b.*")) {
            return "faltasAtrasos";
        }

        if (t.contains("risco")) {
            return "alunosEmRisco";
        }

        if (t.contains("novos alunos") || t.contains("novo aluno")
                || t.contains("matricula")) {
            return "novosAlunos";
        }

        if (t.matches(".*\\b(professores ausentes|professor ausente|ausencia de professor|ausencia de professores)\\b.*")) {
            return "professoresAusentes";
        }

        if (t.contains("relatorio") || t.contains("e-mail")
                || t.contains("email")) {
            return "relatoriosEmail";
        }

        if (t.matches(".*\\b(do sistema|de sistema|gerais|sistema)\\b.*")) {
            return "notificacoesSistema";
        }

        return null;
    }

    /** Extrai o nome depois de "telefone/numero do professor ...". Vazio = o próprio. */
    String extrairNome(String t) {

        Matcher m = Pattern.compile(
                "\\b(?:telefone|celular|whatsapp|zap|fone|contato|numero)\\b(.*)$")
                .matcher(t);

        String resto = m.find() ? m.group(1) : t;

        StringBuilder nome = new StringBuilder();

        for (String palavra : resto.replaceAll("[^a-z0-9 ]", " ").split("\\s+")) {

            if (palavra.isBlank() || PALAVRAS_NOME_IGNORADAS.contains(palavra)) {
                continue;
            }

            if (nome.length() > 0) {
                nome.append(' ');
            }

            nome.append(palavra);
        }

        return nome.toString();
    }

    public static String normalizar(String texto) {

        if (texto == null) {
            return "";
        }

        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return semAcento.toLowerCase(Locale.ROOT)
                .replaceAll("[?!.,;:]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
