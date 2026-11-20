
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

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PresencaService {

    private static final ZoneId ZONA_ESCOLAR =
            ZoneId.of("America/Sao_Paulo");

    private final PresencaRepository presencarepository;
    private final AlunoRepository alunorepository;

    private int proximoId = 1;

    public PresencaService(
            PresencaRepository presencarepository,
            AlunoRepository alunorepository) {

        this.presencarepository = presencarepository;
        this.alunorepository = alunorepository;
    }

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

    public String registrarPresenca(String uid) {

        Aluno aluno = alunorepository.buscarAlunoPeloCartao(uid);

        if (aluno == null) {
            return "Aluno não encontrado";
        }

        if (!alunorepository.verificarCartaoAtivo(uid)) {
            return "Cartão inativo";
        }

        LocalDate data = LocalDate.now(ZONA_ESCOLAR);

        RegistroPresença existente =
                presencarepository.buscarPorAlunoEData(aluno.getId(), data);

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

    public String registrarPresencaManual(PresencaManualRequestDTO dados) {

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

        LocalDate data = dados.getData() != null
                ? dados.getData()
                : LocalDate.now(ZONA_ESCOLAR);

        RegistroPresença existente =
                presencarepository.buscarPorAlunoEData(aluno.getId(), data);

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

    // GERAR FALTAS AUTOMATICAMENTE DE SEGUNDA A SEXTA ÀS 08:40

    @Scheduled(
            cron = "0 40 8 * * MON-FRI",
            zone = "America/Sao_Paulo"
    )
    public void registrarFaltasAutomaticas() {

        LocalDate data = LocalDate.now(ZONA_ESCOLAR);

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

            RegistrarPresença(falta);

            quantidadeFaltas++;
        }

        System.out.println(
                "[EDUCONTROL] Faltas automáticas registradas: "
                        + quantidadeFaltas
        );
    }

    public String RegistrarPresença(RegistroPresença registroPresença) {
        return presencarepository.RegistrarPresenca(registroPresença);
    }

    public List<PresencaResponseDTO> getListaRegistro() {

        return presencarepository.getListaRegistro()
                .stream()
                .map(PresencaMapper::toResponse)
                .collect(Collectors.toList());
    }
}
