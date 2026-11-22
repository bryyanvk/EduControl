
package com.tcc.back_end.Service;

import com.tcc.back_end.Model.Aluno;
import com.tcc.back_end.Model.Notificacao;
import com.tcc.back_end.Model.RegistroPresença;
import com.tcc.back_end.Model.Enum.StatusPresenca;
import com.tcc.back_end.Model.Enum.TipoMarcacao;
import com.tcc.back_end.Model.Enum.OrigemRegistro;
import com.tcc.back_end.Repository.AlunoRepository;
import com.tcc.back_end.Repository.NotificacaoStore;
import com.tcc.back_end.Repository.PresencaRepository;

import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class NotificacaoService {

    private static final ZoneId ZONA_ESCOLAR =
            ZoneId.of("America/Sao_Paulo");

    private static final LocalTime HORARIO_FALTAS =
            LocalTime.of(8, 40);

    private final AlunoRepository alunoRepository;
    private final PresencaRepository presencaRepository;
    private final NotificacaoStore notificacaoStore;

    public NotificacaoService(
            AlunoRepository alunoRepository,
            PresencaRepository presencaRepository,
            NotificacaoStore notificacaoStore
    ) {
        this.alunoRepository = alunoRepository;
        this.presencaRepository = presencaRepository;
        this.notificacaoStore = notificacaoStore;
    }

    public List<Notificacao> listarNotificacoes() {
        atualizarNotificacoes();
        return notificacaoStore.listarTodas();
    }

    public void registrarNovoAluno(Aluno aluno) {

        if (aluno == null) {
            return;
        }

        Notificacao notificacao = new Notificacao(
                "NOVO_ALUNO_" + aluno.getId(),
                "NOVO_ALUNO",
                "Novo aluno cadastrado",
                "O aluno " + aluno.getNome()
                        + " foi cadastrado no sistema.",
                LocalDateTime.now(ZONA_ESCOLAR),
                false,
                aluno.getId(),
                "/alunos"
        );

        notificacaoStore.salvar(notificacao);
    }

    public void atualizarNotificacoes() {

        List<Aluno> alunos = alunoRepository.getListaDeAlunos();

        List<RegistroPresença> registros =
                presencaRepository.getListaRegistro();

        LocalDate dataReferencia = obterUltimoDiaEsperado();

        for (Aluno aluno : alunos) {

            List<RegistroPresença> registrosAluno =
                    new ArrayList<>();

            for (RegistroPresença registro : registros) {

                if (registro == null || registro.getData() == null) {
                    continue;
                }

                if (registro.getAluno() == null) {
                    continue;
                }

                if (!Objects.equals(
                        registro.getAluno().getId(),
                        aluno.getId()
                )) {
                    continue;
                }

                if (registro.getData().isAfter(dataReferencia)) {
                    continue;
                }

                if (ehFimDeSemana(registro.getData())) {
                    continue;
                }

                registrosAluno.add(registro);
            }

            verificarFaltasConsecutivas(
                    aluno,
                    registrosAluno,
                    "",
                    dataReferencia
            );
        }
    }

    private LocalDate obterUltimoDiaEsperado() {

        LocalDate hoje = LocalDate.now(ZONA_ESCOLAR);
        LocalTime agora = LocalTime.now(ZONA_ESCOLAR);

        if (ehFimDeSemana(hoje)) {
            return ultimoDiaLetivo(hoje);
        }

        if (agora.isBefore(HORARIO_FALTAS)) {
            return ultimoDiaLetivo(hoje.minusDays(1));
        }

        return hoje;
    }

    private boolean ehFimDeSemana(LocalDate data) {

        DayOfWeek dia = data.getDayOfWeek();

        return dia == DayOfWeek.SATURDAY
                || dia == DayOfWeek.SUNDAY;
    }

    private void verificarFaltasConsecutivas(
            Aluno aluno,
            List<RegistroPresença> registros,
            String prefixoId,
            LocalDate dataReferencia
    ) {

        if (aluno == null) {
            return;
        }

        if (registros == null || registros.isEmpty()) {
            limparAlertasDoAluno(aluno, prefixoId);
            return;
        }

        Map<LocalDate, RegistroPresença> registrosPorData =
                new HashMap<>();

        for (RegistroPresença registro : registros) {

            if (registro == null || registro.getData() == null) {
                continue;
            }

            if (ehFimDeSemana(registro.getData())) {
                continue;
            }

            registrosPorData.put(
                    registro.getData(),
                    registro
            );
        }

        int faltasConsecutivas = 0;

        LocalDate dataAtual = ultimoDiaLetivo(dataReferencia);

        while (dataAtual != null) {

            if (ehFimDeSemana(dataAtual)) {
                dataAtual = ultimoDiaLetivo(dataAtual.minusDays(1));
                continue;
            }

            RegistroPresença registro =
                    registrosPorData.get(dataAtual);

            if (registro == null
                    || registro.getStatus() != StatusPresenca.FALTA) {
                break;
            }

            faltasConsecutivas++;

            dataAtual = ultimoDiaLetivo(
                    dataAtual.minusDays(1)
            );
        }

        if (faltasConsecutivas >= 4) {

            gerarAlertaFaltas(
                    aluno,
                    faltasConsecutivas,
                    prefixoId
            );

        } else {

            notificacaoStore.excluir(
                    prefixoId + "FALTAS_4_" + aluno.getId()
            );
        }

        if (faltasConsecutivas >= 5) {

            gerarAlertaRisco(
                    aluno,
                    faltasConsecutivas,
                    prefixoId
            );

        } else {

            notificacaoStore.excluir(
                    prefixoId + "ALUNO_RISCO_" + aluno.getId()
            );
        }
    }

    private void limparAlertasDoAluno(
            Aluno aluno,
            String prefixoId
    ) {

        notificacaoStore.excluir(
                prefixoId + "FALTAS_4_" + aluno.getId()
        );

        notificacaoStore.excluir(
                prefixoId + "ALUNO_RISCO_" + aluno.getId()
        );
    }

    private LocalDate ultimoDiaLetivo(LocalDate data) {

        while (ehFimDeSemana(data)) {
            data = data.minusDays(1);
        }

        return data;
    }

    private void gerarAlertaFaltas(
            Aluno aluno,
            int quantidade,
            String prefixoId
    ) {

        String id = prefixoId + "FALTAS_4_" + aluno.getId();

        Notificacao notificacao = new Notificacao(
                id,
                "FALTAS_CONSECUTIVAS",
                "Faltas consecutivas",
                aluno.getNome() + " possui " + quantidade
                        + " faltas consecutivas.",
                LocalDateTime.now(ZONA_ESCOLAR),
                false,
                aluno.getId(),
                "/alunos"
        );

        notificacaoStore.salvar(notificacao);
    }

    private void gerarAlertaRisco(
            Aluno aluno,
            int quantidade,
            String prefixoId
    ) {

        String id = prefixoId + "ALUNO_RISCO_" + aluno.getId();

        Notificacao notificacao = new Notificacao(
                id,
                "ALUNO_RISCO",
                "Aluno em situação de risco",
                aluno.getNome() + " atingiu " + quantidade
                        + " faltas consecutivas e precisa de acompanhamento.",
                LocalDateTime.now(ZONA_ESCOLAR),
                false,
                aluno.getId(),
                "/alunos"
        );

        notificacaoStore.salvar(notificacao);
    }

    public List<Notificacao> simularFaltasConsecutivas(
            int quantidade
    ) {

        if (quantidade < 3) {
            throw new IllegalArgumentException(
                    "O teste aceita 3 ou mais faltas."
            );
        }

        Aluno alunoTeste = new Aluno();

        alunoTeste.setId(900000);
        alunoTeste.setNome("Aluno de teste");

        List<RegistroPresença> registrosTeste =
                new ArrayList<>();

        LocalDate dataReferencia = ultimoDiaLetivo(
                LocalDate.now(ZONA_ESCOLAR)
        );

        LocalDate data = dataReferencia;

        for (int i = 1; i <= quantidade; i++) {

            registrosTeste.add(
                    new RegistroPresença(
                            i,
                            data,
                            null,
                            StatusPresenca.FALTA,
                            TipoMarcacao.ENTRADA,
                            OrigemRegistro.AUTOMATICA,
                            alunoTeste
                    )
            );

            data = ultimoDiaLetivo(data.minusDays(1));
        }

        verificarFaltasConsecutivas(
                alunoTeste,
                registrosTeste,
                "TESTE_",
                dataReferencia
        );

        return notificacaoStore.listarTodas()
                .stream()
                .filter(n -> n.getId().startsWith("TESTE_"))
                .toList();
    }

    public void limparNotificacoesDeTeste() {
        notificacaoStore.removerPorPrefixo("TESTE_");
    }

    public void marcarComoLida(String id) {
        notificacaoStore.marcarComoLida(id);
    }

    public void marcarTodasComoLidas() {
        notificacaoStore.marcarTodasComoLidas();
    }

    public long contarNaoLidas() {
        atualizarNotificacoes();
        return notificacaoStore.contarNaoLidas();
    }

    public void excluirNotificacao(String id) {
        notificacaoStore.excluir(id);
    }
}
