
package com.tcc.back_end.DTO;

import com.tcc.back_end.Model.Enum.StatusPresenca;
import com.tcc.back_end.Model.Enum.TipoMarcacao;
import com.tcc.back_end.Model.Enum.OrigemRegistro;

import java.time.LocalDate;
import java.time.LocalTime;

public class PresencaResponseDTO {

    private Integer id;
    private LocalDate data;
    private LocalTime horario;
    private StatusPresenca status;
    private TipoMarcacao tipo;
    private OrigemRegistro origem;

    private Integer alunoId;
    private String alunoNome;
    private String matricula;
    private Integer turmaId;
    private String turmaNome;

    public PresencaResponseDTO() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public TipoMarcacao getTipo() {
        return tipo;
    }

    public void setTipo(TipoMarcacao tipo) {
        this.tipo = tipo;
    }

    public OrigemRegistro getOrigem() {
        return origem;
    }

    public void setOrigem(OrigemRegistro origem) {
        this.origem = origem;
    }

    public Integer getAlunoId() {
        return alunoId;
    }

    public void setAlunoId(Integer alunoId) {
        this.alunoId = alunoId;
    }

    public String getAlunoNome() {
        return alunoNome;
    }

    public void setAlunoNome(String alunoNome) {
        this.alunoNome = alunoNome;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    public Integer getTurmaId() {
        return turmaId;
    }

    public void setTurmaId(Integer turmaId) {
        this.turmaId = turmaId;
    }

    public String getTurmaNome() {
        return turmaNome;
    }

    public void setTurmaNome(String turmaNome) {
        this.turmaNome = turmaNome;
    }
}
