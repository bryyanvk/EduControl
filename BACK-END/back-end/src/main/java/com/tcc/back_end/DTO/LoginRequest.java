package com.tcc.back_end.DTO;

public class LoginRequest {

    private String identificador;
    private String senha;

    public LoginRequest() {
    }

    public LoginRequest(String identificador, String senha) {
        this.identificador = identificador;
        this.senha = senha;
    }

    public String getIdentificador() {
        return identificador;
    }

    public void setIdentificador(String identificador) {
        this.identificador = identificador;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }
}
