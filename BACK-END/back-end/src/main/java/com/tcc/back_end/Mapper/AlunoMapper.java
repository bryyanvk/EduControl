package com.tcc.back_end.Mapper;

import com.tcc.back_end.DTO.AlunoRequestDTO;
import com.tcc.back_end.DTO.AlunoResponseDTO;
import com.tcc.back_end.DTO.CartaoRFIDDTO;
import com.tcc.back_end.Model.Aluno;
import com.tcc.back_end.Model.CartãoRFID;
import com.tcc.back_end.Model.Turma;

public class AlunoMapper {

    public static Aluno toModel(AlunoRequestDTO dto, Turma turma) {

        Aluno aluno = new Aluno();

        aluno.setNome(dto.getNome());
        aluno.setMatricula(dto.getMatricula());
        aluno.setDataNascimento(dto.getDataNascimento());
        aluno.setCpf(dto.getCpf());
        aluno.setTurma(turma);
        aluno.setTurno(dto.getTurno());
        aluno.setResponsavelNome(dto.getResponsavelNome());
        aluno.setParentesco(dto.getParentesco());
        aluno.setResponsavelTelefone(dto.getResponsavelTelefone());
        aluno.setResponsavelEmail(dto.getResponsavelEmail());
        aluno.setEndereco(dto.getEndereco());
        aluno.setDataMatricula(dto.getDataMatricula());

        if (dto.getCartao() != null) {
            CartãoRFID cartao = new CartãoRFID(
                    dto.getCartao().getUid(),
                    dto.getCartao().isAtivo()
            );

            aluno.setCartao(cartao);
        }

        return aluno;
    }

    public static AlunoResponseDTO toResponse(Aluno aluno) {

        AlunoResponseDTO dto = new AlunoResponseDTO();

        dto.setId(aluno.getId());
        dto.setNome(aluno.getNome());
        dto.setMatricula(aluno.getMatricula());
        dto.setDataNascimento(aluno.getDataNascimento());
        dto.setCpf(aluno.getCpf());
        dto.setTurno(aluno.getTurno());
        dto.setResponsavelNome(aluno.getResponsavelNome());
        dto.setParentesco(aluno.getParentesco());
        dto.setResponsavelTelefone(aluno.getResponsavelTelefone());
        dto.setResponsavelEmail(aluno.getResponsavelEmail());
        dto.setEndereco(aluno.getEndereco());
        dto.setDataMatricula(aluno.getDataMatricula());

        if (aluno.getDataNascimento() != null) {
            dto.setIdade(aluno.calcularIdade());
        }

        if (aluno.getCartao() != null) {
            CartaoRFIDDTO cartao = new CartaoRFIDDTO();
            cartao.setUid(aluno.getCartao().getUid());
            cartao.setAtivo(aluno.getCartao().isAtivo());

            dto.setCartao(cartao);
        }

        if (aluno.getTurma() != null) {
            dto.setTurmaId(aluno.getTurma().getId());
            dto.setTurmaNome(aluno.getTurma().getNome());
        }

        return dto;
    }
}