package com.tcc.back_end.Model;

import java.time.LocalDateTime;

public class Notificacao {

    private String id;
    private String tipo;
    private String titulo;
    private String mensagem;
    private LocalDateTime dataHora;
    private boolean lida;
    private Integer alunoId;
    private String rota;

    public Notificacao() {
    }

    public Notificacao(
            String id,
            String tipo,
            String titulo,
            String mensagem,
            LocalDateTime dataHora,
            boolean lida,
            Integer alunoId,
            String rota
    ) {
        this.id = id;
        this.tipo = tipo;
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.dataHora = dataHora;
        this.lida = lida;
        this.alunoId = alunoId;
        this.rota = rota;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public boolean isLida() {
        return lida;
    }

    public void setLida(boolean lida) {
        this.lida = lida;
    }

    public Integer getAlunoId() {
        return alunoId;
    }

    public void setAlunoId(Integer alunoId) {
        this.alunoId = alunoId;
    }

    public String getRota() {
        return rota;
    }

    public void setRota(String rota) {
        this.rota = rota;
    }
}