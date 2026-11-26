
package com.tcc.back_end.DTO;

import com.tcc.back_end.Model.Enum.TipoAcesso;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TeamResponseDTO {

    private Integer id;
    private String matricula;
    private String nome;
    private LocalDate dataNascimento;
    private String cpf;
    private String status;
    private String tipoVinculo;
    private String cargo;
    private String setor;
    private LocalDate dataAdmissao;
    private int jornadaSemanal;
    private String telefone;
    private String email;
    private String endereco;
    private TipoAcesso tipoAcesso;
    private boolean acessoAtivo;
    private String fotoPerfil;
    private LocalDate fimContrato;
    private LocalDateTime ultimoAcesso;
    private LocalDateTime dataCriacaoConta;
    private LocalDateTime dataAlteracaoSenha;

    public TeamResponseDTO() {
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

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTipoVinculo() {
        return tipoVinculo;
    }

    public void setTipoVinculo(String tipoVinculo) {
        this.tipoVinculo = tipoVinculo;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public String getSetor() {
        return setor;
    }

    public void setSetor(String setor) {
        this.setor = setor;
    }

    public LocalDate getDataAdmissao() {
        return dataAdmissao;
    }

    public void setDataAdmissao(LocalDate dataAdmissao) {
        this.dataAdmissao = dataAdmissao;
    }

    public int getJornadaSemanal() {
        return jornadaSemanal;
    }

    public void setJornadaSemanal(int jornadaSemanal) {
        this.jornadaSemanal = jornadaSemanal;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public TipoAcesso getTipoAcesso() {
        return tipoAcesso;
    }

    public void setTipoAcesso(TipoAcesso tipoAcesso) {
        this.tipoAcesso = tipoAcesso;
    }

    public boolean isAcessoAtivo() {
        return acessoAtivo;
    }

    public void setAcessoAtivo(boolean acessoAtivo) {
        this.acessoAtivo = acessoAtivo;
    }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
    }

    public LocalDate getFimContrato() {
        return fimContrato;
    }

    public void setFimContrato(LocalDate fimContrato) {
        this.fimContrato = fimContrato;
    }

    public LocalDateTime getUltimoAcesso() {
        return ultimoAcesso;
    }

    public void setUltimoAcesso(LocalDateTime ultimoAcesso) {
        this.ultimoAcesso = ultimoAcesso;
    }

    public LocalDateTime getDataCriacaoConta() {
        return dataCriacaoConta;
    }

    public void setDataCriacaoConta(LocalDateTime dataCriacaoConta) {
        this.dataCriacaoConta = dataCriacaoConta;
    }

    public LocalDateTime getDataAlteracaoSenha() {
        return dataAlteracaoSenha;
    }

    public void setDataAlteracaoSenha(LocalDateTime dataAlteracaoSenha) {
        this.dataAlteracaoSenha = dataAlteracaoSenha;
    }
}
