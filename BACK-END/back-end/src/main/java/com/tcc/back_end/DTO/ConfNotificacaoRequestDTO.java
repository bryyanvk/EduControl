
package com.tcc.back_end.DTO;

public class ConfNotificacaoRequestDTO {

    private boolean notificacoesSistema;
    private boolean faltasAtrasos;
    private boolean alunosEmRisco;
    private boolean novosAlunos;
    private boolean professoresAusentes;
    private boolean relatoriosEmail;

    public ConfNotificacaoRequestDTO() {
    }

    public boolean isNotificacoesSistema() {
        return notificacoesSistema;
    }

    public void setNotificacoesSistema(boolean notificacoesSistema) {
        this.notificacoesSistema = notificacoesSistema;
    }

    public boolean isFaltasAtrasos() {
        return faltasAtrasos;
    }

    public void setFaltasAtrasos(boolean faltasAtrasos) {
        this.faltasAtrasos = faltasAtrasos;
    }

    public boolean isAlunosEmRisco() {
        return alunosEmRisco;
    }

    public void setAlunosEmRisco(boolean alunosEmRisco) {
        this.alunosEmRisco = alunosEmRisco;
    }

    public boolean isNovosAlunos() {
        return novosAlunos;
    }

    public void setNovosAlunos(boolean novosAlunos) {
        this.novosAlunos = novosAlunos;
    }

    public boolean isProfessoresAusentes() {
        return professoresAusentes;
    }

    public void setProfessoresAusentes(boolean professoresAusentes) {
        this.professoresAusentes = professoresAusentes;
    }

    public boolean isRelatoriosEmail() {
        return relatoriosEmail;
    }

    public void setRelatoriosEmail(boolean relatoriosEmail) {
        this.relatoriosEmail = relatoriosEmail;
    }
}
