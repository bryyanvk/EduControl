
package com.tcc.back_end.Service;

import com.tcc.back_end.DTO.AlunoRequestDTO;
import com.tcc.back_end.DTO.AlunoResponseDTO;
import com.tcc.back_end.Mapper.AlunoMapper;
import com.tcc.back_end.Model.Aluno;
import com.tcc.back_end.Model.Turma;
import com.tcc.back_end.Repository.AlunoRepository;
import com.tcc.back_end.Repository.TurmaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AlunoService {

    private final AlunoRepository alunorepository;
    private final TurmaRepository turmaRepository;

    public AlunoService(
            AlunoRepository alunorepository,
            TurmaRepository turmaRepository) {

        this.alunorepository = alunorepository;
        this.turmaRepository = turmaRepository;
    }

    private void validarMatricula(String matricula, Integer alunoIdIgnorado) {

        if (matricula == null || matricula.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o número da matrícula."
            );
        }

        if (alunorepository.matriculaEmUso(matricula, alunoIdIgnorado)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Essa matrícula já está cadastrada para outro aluno."
            );
        }
    }

    public String CadastrarAluno(AlunoRequestDTO dto) {

        validarMatricula(dto.getMatricula(), null);

        if (dto.getTurmaId() == null) {
            return "É necessário informar uma turma!";
        }

        Turma turma = turmaRepository.BuscarTurma(dto.getTurmaId());

        if (turma == null) {
            return "Turma não encontrada!";
        }

        Aluno aluno = AlunoMapper.toModel(dto, turma);

        if (turma.getAlunos() == null) {
            turma.setAlunos(new ArrayList<>());
        }

        String resultado = alunorepository.CadastrarAluno(aluno);

        turma.getAlunos().add(aluno);

        return resultado;
    }

    public List<AlunoResponseDTO> getListaDeAlunos() {

        return alunorepository.getListaDeAlunos()
                .stream()
                .map(AlunoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public AlunoResponseDTO buscarAlunoPorId(int id) {

        Aluno aluno = alunorepository.buscarAlunoPorId(id);

        if (aluno == null) {
            return null;
        }

        return AlunoMapper.toResponse(aluno);
    }

    public String updateAluno(int id, AlunoRequestDTO dto) {

        Aluno alunoAtual = alunorepository.buscarAlunoPorId(id);

        if (alunoAtual == null) {
            return "Aluno não encontrado!";
        }

        validarMatricula(dto.getMatricula(), id);

        if (dto.getTurmaId() == null) {
            return "É necessário informar uma turma!";
        }

        Turma turmaNova = turmaRepository.BuscarTurma(dto.getTurmaId());

        if (turmaNova == null) {
            return "Turma não encontrada!";
        }

        Turma turmaAntiga = alunoAtual.getTurma();

        Aluno alunoAtualizado = AlunoMapper.toModel(dto, turmaNova);
        alunoAtualizado.setId(id);

        String resultado = alunorepository.updateAluno(id, alunoAtualizado);

        if (!Objects.equals(
                turmaAntiga != null ? turmaAntiga.getId() : null,
                turmaNova.getId())) {

            if (turmaAntiga != null && turmaAntiga.getAlunos() != null) {
                turmaAntiga.getAlunos().remove(alunoAtual);
            }

            if (turmaNova.getAlunos() == null) {
                turmaNova.setAlunos(new ArrayList<>());
            }

            turmaNova.getAlunos().add(alunoAtual);
        }

        return resultado;
    }

    public String deleteAluno(int id) {

        Aluno aluno = alunorepository.buscarAlunoPorId(id);

        if (aluno == null) {
            return "Aluno não encontrado!";
        }

        Turma turma = aluno.getTurma();

        if (turma != null && turma.getAlunos() != null) {
            turma.getAlunos().remove(aluno);
        }

        return alunorepository.deleteAluno(id);
    }
}
