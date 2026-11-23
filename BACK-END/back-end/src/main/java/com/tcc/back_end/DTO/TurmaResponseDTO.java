
package com.tcc.back_end.DTO;

public class TurmaResponseDTO {

    private Integer id;
    private String nome;
    private String curso;
    private String turno;
    private Integer quantidadeAlunos;

    public TurmaResponseDTO() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCurso() {
        return curso;
    }

    public void setCurso(String curso) {
        this.curso = curso;
    }

    public String getTurno() {
        return turno;
    }

    public void setTurno(String turno) {
        this.turno = turno;
    }

    public Integer getQuantidadeAlunos() {
        return quantidadeAlunos;
    }

    public void setQuantidadeAlunos(Integer quantidadeAlunos) {
        this.quantidadeAlunos = quantidadeAlunos;
    }

    public static class ConfNotificacaoRequestDTO {

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

    public static class ConfNotificacaoResponseDTO {

        private boolean notificacoesSistema;
        private boolean faltasAtrasos;
        private boolean alunosEmRisco;
        private boolean novosAlunos;
        private boolean professoresAusentes;
        private boolean relatoriosEmail;

        public ConfNotificacaoResponseDTO() {
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
}
