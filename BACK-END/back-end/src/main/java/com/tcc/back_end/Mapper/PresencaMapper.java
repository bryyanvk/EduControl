
package com.tcc.back_end.Mapper;

import com.tcc.back_end.DTO.PresencaResponseDTO;
import com.tcc.back_end.Model.Aluno;
import com.tcc.back_end.Model.RegistroPresença;

public class PresencaMapper {

    public static PresencaResponseDTO toResponse(RegistroPresença registro) {

        PresencaResponseDTO dto = new PresencaResponseDTO();

        dto.setId(registro.getId());
        dto.setData(registro.getData());
        dto.setHorario(registro.getHorario());
        dto.setStatus(registro.getStatus());
        dto.setTipo(registro.getTipo());
        dto.setOrigem(registro.getOrigem());

        Aluno aluno = registro.getAluno();

        if (aluno != null) {

            dto.setAlunoId(aluno.getId());
            dto.setAlunoNome(aluno.getNome());
            dto.setMatricula(aluno.getMatricula());

            if (aluno.getTurma() != null) {
                dto.setTurmaId(aluno.getTurma().getId());
                dto.setTurmaNome(aluno.getTurma().getNome());
            }
        }

        return dto;
    }
}
