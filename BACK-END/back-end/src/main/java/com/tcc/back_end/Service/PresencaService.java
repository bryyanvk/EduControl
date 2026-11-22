
package com.tcc.back_end.Service;

import com.tcc.back_end.DTO.AlunoResponseDTO;
import com.tcc.back_end.DTO.PresencaManualRequestDTO;
import com.tcc.back_end.DTO.PresencaResponseDTO;
import com.tcc.back_end.Mapper.AlunoMapper;
import com.tcc.back_end.Mapper.PresencaMapper;
import com.tcc.back_end.Model.Aluno;
import com.tcc.back_end.Model.Enum.OrigemRegistro;
import com.tcc.back_end.Model.Enum.StatusPresenca;
import com.tcc.back_end.Model.Enum.TipoMarcacao;
import com.tcc.back_end.Model.RegistroPresença;
import com.tcc.back_end.Repository.AlunoRepository;
import com.tcc.back_end.Repository.PresencaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PresencaService {

    private static final ZoneId ZONA_ESCOLAR =
            ZoneId.of("America/Sao_Paulo");

    private static final LocalTime HORARIO_DESATIVACAO =
            LocalTime.of(8, 40);

    private final PresencaRepository presencarepository;
    private final AlunoRepository alunorepository;
    private final NotificacaoService notificacaoService;

    private int proximoId = 1;

    // Controle do leitor RFID
    private boolean leitorRfidAtivo = true;

    // Indica se o administrador alterou o estado após as 08:40
    private boolean estadoDefinidoManualmenteAposLimite = false;

    // Data do último controle
    private LocalDate dataControleRfid =
            LocalDate.now(ZONA_ESCOLAR);

    public PresencaService(
            PresencaRepository presencarepository,
            AlunoRepository alunorepository,
            NotificacaoService notificacaoService
    ) {
        this.presencarepository = presencarepository;
        this.alunorepository = alunorepository;
        this.notificacaoService = notificacaoService;
    }

    private boolean ehFimDeSemana(LocalDate data) {

        DayOfWeek dia = data.getDayOfWeek();

        return dia == DayOfWeek.SATURDAY
                || dia == DayOfWeek.SUNDAY;
    }

    private void validarDiaLetivo(LocalDate data) {

        if (data == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Data do registro não informada."
            );
        }

        if (ehFimDeSemana(data)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não é permitido registrar presença em finais de semana."
            );
        }
    }

    // ==============================
    // CONTROLE DO LEITOR RFID
    // ==============================

    private void atualizarEstadoRfid() {

        LocalDate hoje = LocalDate.now(ZONA_ESCOLAR);
        LocalTime agora = LocalTime.now(ZONA_ESCOLAR);

        // Reinicia o controle quando muda o dia
        if (!hoje.equals(dataControleRfid)) {

            dataControleRfid = hoje;
            leitorRfidAtivo = true;
            estadoDefinidoManualmenteAposLimite = false;
        }

        // Desativa automaticamente às 08:40
        if (!ehFimDeSemana(hoje)
                && !agora.isBefore(HORARIO_DESATIVACAO)
                && !estadoDefinidoManualmenteAposLimite) {

            leitorRfidAtivo = false;
        }
    }

    public boolean isLeitorRfidAtivo() {

        atualizarEstadoRfid();

        return leitorRfidAtivo;
    }

    public void definirEstadoRfid(boolean ativo) {

        atualizarEstadoRfid();

        LocalTime agora = LocalTime.now(ZONA_ESCOLAR);

        leitorRfidAtivo = ativo;

        // Após as 08:40, respeita a decisão manual
        if (!agora.isBefore(HORARIO_DESATIVACAO)) {
            estadoDefinidoManualmenteAposLimite = true;
        }
    }

    // ==============================
    // CONSULTA DE CARTÕES E ALUNOS
    // ==============================

    public String identificarAlunoPeloCartao(String uid) {
        return alunorepository.identificarAlunoPeloCartao(uid);
    }

    public boolean verificarCartaoAtivo(String uid) {
        return alunorepository.verificarCartaoAtivo(uid);
    }

    public StatusPresenca definirStatusPresença(LocalTime horario) {

        LocalTime limite = LocalTime.of(7, 10);

        if (horario.isAfter(limite)) {
            return StatusPresenca.ATRASADO;
        }

        return StatusPresenca.PRESENTE;
    }

    public AlunoResponseDTO buscarAlunoPeloCartao(String uid) {

        Aluno aluno = alunorepository.buscarAlunoPeloCartao(uid);

        if (aluno == null) {
            return null;
        }

        return AlunoMapper.toResponse(aluno);
    }

    // ==============================
    // REGISTRO RFID
    // ==============================

    public String registrarPresenca(String uid) {

        LocalDate data = LocalDate.now(ZONA_ESCOLAR);

        validarDiaLetivo(data);

        atualizarEstadoRfid();

        if (!leitorRfidAtivo) {
            return "Leitor RFID desativado. Registro não permitido.";
        }

        Aluno aluno = alunorepository.buscarAlunoPeloCartao(uid);

        if (aluno == null) {
            return "Aluno não encontrado";
        }

        if (!alunorepository.verificarCartaoAtivo(uid)) {
            return "Cartão inativo";
        }

        RegistroPresença existente =
                presencarepository.buscarPorAlunoEData(
                        aluno.getId(),
                        data
                );

        if (existente != null) {
            return "Presença já registrada hoje. Origem: "
                    + existente.getOrigem();
        }

        LocalTime horario = LocalTime.now(ZONA_ESCOLAR);
        StatusPresenca status = definirStatusPresença(horario);

        RegistroPresença registro = new RegistroPresença(
                proximoId++,
                data,
                horario,
                status,
                TipoMarcacao.ENTRADA,
                OrigemRegistro.RFID,
                aluno
        );

        return RegistrarPresença(registro);
    }

    // ==============================
    // REGISTRO MANUAL
    // ==============================

    public String registrarPresencaManual(PresencaManualRequestDTO dados) {

        if (dados == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados do registro não informados."
            );
        }

        if (dados.getAlunoId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "ID do aluno não informado"
            );
        }

        if (dados.getStatus() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status não informado"
            );
        }

        LocalDate data = dados.getData() != null
                ? dados.getData()
                : LocalDate.now(ZONA_ESCOLAR);

        validarDiaLetivo(data);

        Aluno aluno = alunorepository.buscarAlunoPorId(dados.getAlunoId());

        if (aluno == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Aluno não encontrado"
            );
        }

        StatusPresenca status = dados.getStatus();
        LocalTime horario = dados.getHorario();

        if ((status == StatusPresenca.PRESENTE
                || status == StatusPresenca.ATRASADO)
                && horario == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o horário de entrada"
            );
        }

        RegistroPresença existente =
                presencarepository.buscarPorAlunoEData(
                        aluno.getId(),
                        data
                );

        if (existente != null) {

            if (existente.getOrigem() == OrigemRegistro.RFID) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Este aluno já possui presença registrada pelo RFID. "
                                + "O registro não pode ser alterado manualmente."
                );
            }

            existente.setStatus(status);
            existente.setHorario(horario);
            existente.setTipo(TipoMarcacao.ENTRADA);
            existente.setOrigem(OrigemRegistro.MANUAL);

            notificacaoService.atualizarNotificacoes();

            return "Registro manual atualizado com sucesso!";
        }

        RegistroPresença registro = new RegistroPresença(
                proximoId++,
                data,
                horario,
                status,
                TipoMarcacao.ENTRADA,
                OrigemRegistro.MANUAL,
                aluno
        );

        return RegistrarPresença(registro);
    }

    // ==============================
    // FALTAS AUTOMÁTICAS
    // ==============================

    @Scheduled(
            cron = "0 40 8 * * MON-FRI",
            zone = "America/Sao_Paulo"
    )
    public void registrarFaltasAutomaticas() {

        atualizarEstadoRfid();

        LocalDate data = LocalDate.now(ZONA_ESCOLAR);

        if (ehFimDeSemana(data)) {
            System.out.println(
                    "[EDUCONTROL] Faltas automáticas não executadas: fim de semana."
            );
            return;
        }

        List<Aluno> alunos = alunorepository.getListaDeAlunos();

        int quantidadeFaltas = 0;

        for (Aluno aluno : alunos) {

            RegistroPresença existente =
                    presencarepository.buscarPorAlunoEData(
                            aluno.getId(),
                            data
                    );

            if (existente != null) {
                continue;
            }

            RegistroPresença falta = new RegistroPresença(
                    proximoId++,
                    data,
                    null,
                    StatusPresenca.FALTA,
                    TipoMarcacao.ENTRADA,
                    OrigemRegistro.AUTOMATICA,
                    aluno
            );

            presencarepository.RegistrarPresenca(falta);

            quantidadeFaltas++;
        }

        System.out.println(
                "[EDUCONTROL] Faltas automáticas registradas: "
                        + quantidadeFaltas
        );

        notificacaoService.atualizarNotificacoes();
    }

    // ==============================
    // SALVAR REGISTRO
    // ==============================

    public String RegistrarPresença(RegistroPresença registroPresença) {

        if (registroPresença == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registro de presença não informado."
            );
        }

        validarDiaLetivo(registroPresença.getData());

        String resultado =
                presencarepository.RegistrarPresenca(registroPresença);

        notificacaoService.atualizarNotificacoes();

        return resultado;
    }

    // ==============================
    // LISTAGEM DE PRESENÇAS
    // ==============================

    public List<PresencaResponseDTO> getListaRegistro() {

        return presencarepository.getListaRegistro()
                .stream()
                .map(PresencaMapper::toResponse)
                .collect(Collectors.toList());
    }
}
