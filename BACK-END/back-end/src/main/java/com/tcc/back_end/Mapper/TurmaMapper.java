
package com.tcc.back_end.Mapper;

import com.tcc.back_end.Model.Turma;
import com.tcc.back_end.DTO.TurmaRequestDTO;
import com.tcc.back_end.DTO.TurmaResponseDTO;

public class TurmaMapper {

    // Converte os dados recebidos do frontend em uma Turma
    public static Turma toModel(TurmaRequestDTO dto) {

        Turma turma = new Turma();

        turma.setNome(dto.getNome());
        turma.setCurso(dto.getCurso());
        turma.setTurno(dto.getTurno());

        return turma;
    }

    // Converte uma Turma em DTO para enviar ao frontend
    public static TurmaResponseDTO toResponse(Turma turma) {

        TurmaResponseDTO dto = new TurmaResponseDTO();

        dto.setId(turma.getId());
        dto.setNome(turma.getNome());
        dto.setCurso(turma.getCurso());
        dto.setTurno(turma.getTurno());

        dto.setQuantidadeAlunos(
                turma.getAlunos() != null ? turma.getAlunos().size() : 0
        );

        return dto;
    }
}
