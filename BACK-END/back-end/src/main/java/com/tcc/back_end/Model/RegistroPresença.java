
package com.tcc.back_end.Model;

import com.tcc.back_end.Model.Enum.StatusPresenca;
import com.tcc.back_end.Model.Enum.TipoMarcacao;
import com.tcc.back_end.Model.Enum.OrigemRegistro;

import java.time.LocalDate;
import java.time.LocalTime;

public class RegistroPresença {

    private Integer id;
    private LocalDate data;
    private LocalTime horario;
    private StatusPresenca status;
    private TipoMarcacao tipo;
    private OrigemRegistro origem;
    private Aluno aluno;

    public RegistroPresença() {
    }

    public RegistroPresença(
            Integer id,
            LocalDate data,
            LocalTime horario,
            StatusPresenca status,
            TipoMarcacao tipo,
            OrigemRegistro origem,
            Aluno aluno) {

        this.id = id;
        this.data = data;
        this.horario = horario;
        this.status = status;
        this.tipo = tipo;
        this.origem = origem;
        this.aluno = aluno;
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

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }
}
