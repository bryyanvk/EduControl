package com.tcc.back_end.DTO;

import com.tcc.back_end.Model.Enum.TipoAcesso;
import com.tcc.back_end.Model.Team;

public class LoginResponse {

    private Integer id;
    private String matricula;
    private String nome;
    private String email;
    private TipoAcesso tipoAcesso;
    private String cargo;
    private String telefone;
    private String fotoPerfil;

    public LoginResponse() {
    }

    public LoginResponse(Team team) {
        this.id = team.getId();
        this.matricula = team.getMatricula();
        this.nome = team.getNome();
        this.email = team.getEmail();
        this.tipoAcesso = team.getTipoAcesso();
        this.cargo = team.getCargo();
        this.telefone = team.getTelefone();
        this.fotoPerfil = team.getFotoPerfil();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public TipoAcesso getTipoAcesso() {
        return tipoAcesso;
    }

    public void setTipoAcesso(TipoAcesso tipoAcesso) {
        this.tipoAcesso = tipoAcesso;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
    }
}
