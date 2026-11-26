package com.tcc.back_end.ia;

import com.tcc.back_end.ia.Service.RoteadorIntencaoService;
import com.tcc.back_end.ia.Service.RoteadorIntencaoService.Intencao;
import com.tcc.back_end.ia.Service.RoteadorIntencaoService.Tipo;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoteadorIntencaoServiceTest {

    private final RoteadorIntencaoService roteador = new RoteadorIntencaoService();

    private Intencao i(String texto) {
        return roteador.interpretar(texto, false);
    }

    @Test
    void contagemDeEquipe() {
        assertEquals(Tipo.CONTAR_DADOS, i("Quantos professores estão no sistema?").tipo());
        assertEquals(List.of("PROFESSOR"), i("quantos professores").categorias());
        assertEquals(List.of("FUNCIONARIO"), i("Qual a quantidade de funcionários?").categorias());
        assertEquals(Tipo.CONTAR_DADOS, i("número de professores").tipo());
    }

    @Test
    void telefoneTemPrioridadeSobreNumero() {
        Intencao t = i("Qual o número do professor João Silva?");
        assertEquals(Tipo.TELEFONE, t.tipo());
        assertEquals("joao silva", t.nome());

        assertEquals("maria", i("telefone da Maria").nome());
        assertEquals("PROPRIO", i("meu telefone").valor());
    }

    @Test
    void aparenciaSoAlteraComVerbo() {
        Intencao a = i("Mude a cor do sistema para escuro");
        assertEquals(Tipo.ALTERAR_APARENCIA, a.tipo());
        assertEquals("escuro", a.valor());

        assertEquals("claro", i("troque o tema para claro").valor());
        assertEquals("auto", i("deixe a aparência automática").valor());
        assertEquals(Tipo.CONSULTAR_APARENCIA, i("qual é o tema atual?").tipo());

        // Sem verbo de alteração, não mexe: vai para a conversa livre.
        assertEquals(Tipo.LIVRE, i("o modo escuro é bom?").tipo());
        assertEquals(Tipo.LIVRE, i("explique o modo como as faltas são contadas").tipo());
    }

    @Test
    void notificacoes() {
        Intencao n = i("Desative as notificações de faltas");
        assertEquals(Tipo.ALTERAR_NOTIFICACAO, n.tipo());
        assertEquals("faltasAtrasos", n.campo());
        assertEquals(Boolean.FALSE, n.ligar());

        assertEquals(Boolean.TRUE, i("ative os relatórios por e-mail").ligar());
        assertEquals("relatoriosEmail", i("ative os relatórios por e-mail").campo());
        assertEquals("alunosEmRisco", i("desligue os alertas de alunos em risco").campo());
        assertEquals(null, i("desative as notificações").campo());
    }

    @Test
    void confirmarECancelarSoComAcaoPendente() {
        assertEquals(Tipo.CONFIRMAR, roteador.interpretar("Sim", true).tipo());
        assertEquals(Tipo.CANCELAR, roteador.interpretar("não", true).tipo());
        assertEquals(Tipo.LIVRE, roteador.interpretar("sim", false).tipo());
        assertTrue(roteador.interpretar("sim, mas explique melhor", true).tipo() == Tipo.LIVRE);
    }
}
