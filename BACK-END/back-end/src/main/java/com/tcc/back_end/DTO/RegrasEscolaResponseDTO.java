
package com.tcc.back_end.DTO;

import java.time.LocalTime;

public class RegrasEscolaResponseDTO {

    private LocalTime horarioLimite;
    private Integer anoLetivo;
    private String turno;

    public RegrasEscolaResponseDTO() {
    }

    public LocalTime getHorarioLimite() {
        return horarioLimite;
    }

    public void setHorarioLimite(LocalTime horarioLimite) {
        this.horarioLimite = horarioLimite;
    }

    public Integer getAnoLetivo() {
        return anoLetivo;
    }

    public void setAnoLetivo(Integer anoLetivo) {
        this.anoLetivo = anoLetivo;
    }

    public String getTurno() {
        return turno;
    }

    public void setTurno(String turno) {
        this.turno = turno;
    }
}
