package com.tcc.back_end.DTO;

public class CartaoRFIDDTO {

    private String uid;
    private boolean ativo;

    public CartaoRFIDDTO() {
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }
}