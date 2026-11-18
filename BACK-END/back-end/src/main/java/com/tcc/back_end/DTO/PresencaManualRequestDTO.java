
package com.tcc.back_end.DTO;

import java.time.LocalDate;
import java.time.LocalTime;

import com.tcc.back_end.Model.Enum.StatusPresenca;

public class PresencaManualRequestDTO {

    private Integer alunoId;
    private LocalDate data;
    private LocalTime horario;
    private StatusPresenca status;

    public Integer getAlunoId() {
        return alunoId;
    }

    public void setAlunoId(Integer alunoId) {
        this.alunoId = alunoId;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public LocalTime getHorario() {
        return horario;
    }

    public void setHorario(LocalTime horario) {
        this.horario = horario;
    }

    public StatusPresenca getStatus() {
        return status;
    }

    public void setStatus(StatusPresenca status) {
        this.status = status;
    }
}
