
package com.tcc.back_end.Repository;

import com.tcc.back_end.Model.Team;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class TeamRepository {

    private final List<Team> listaTeam = new ArrayList<>();
    private Integer proximoId = 1;

    public String cadastrarTeam(Team team) {
        if (team == null) {
            return "É necessário informar os dados do profissional!";
        }

        team.setId(proximoId++);
        listaTeam.add(team);

        return "Profissional cadastrado com sucesso!";
    }

    public List<Team> getListaTeam() {
        return new ArrayList<>(listaTeam);
    }

    public Team buscarTeamPorId(Integer id) {
        if (id == null) {
            return null;
        }

        for (Team t : listaTeam) {
            if (t.getId() != null && t.getId().equals(id)) {
                return t;
            }
        }

        return null;
    }

    public Team buscarTeamPorMatricula(String matricula) {
        if (matricula == null) {
            return null;
        }

        for (Team t : listaTeam) {
            if (t.getMatricula() != null
                    && t.getMatricula().equals(matricula)) {
                return t;
            }
        }

        return null;
    }

    public Team buscarTeamPorCpf(String cpf) {
        if (cpf == null) {
            return null;
        }

        for (Team t : listaTeam) {
            if (t.getCpf() != null && t.getCpf().equals(cpf)) {
                return t;
            }
        }

        return null;
    }

    public Team buscarTeamPorEmail(String email) {
        if (email == null) {
            return null;
        }

        for (Team t : listaTeam) {
            if (t.getEmail() != null
                    && t.getEmail().equalsIgnoreCase(email)) {
                return t;
            }
        }

        return null;
    }

    public String updateTeam(Integer id, Team teamUpdate) {
        if (id == null || teamUpdate == null) {
            return "É necessário informar os dados do profissional!";
        }

        Team team = buscarTeamPorId(id);

        if (team == null) {
            return "Profissional não encontrado!";
        }

        team.setMatricula(teamUpdate.getMatricula());
        team.setNome(teamUpdate.getNome());
        team.setDataNascimento(teamUpdate.getDataNascimento());
        team.setCpf(teamUpdate.getCpf());
        team.setStatus(teamUpdate.getStatus());
        team.setTipoVinculo(teamUpdate.getTipoVinculo());
        team.setCargo(teamUpdate.getCargo());
        team.setSetor(teamUpdate.getSetor());
        team.setDataAdmissao(teamUpdate.getDataAdmissao());
        team.setJornadaSemanal(teamUpdate.getJornadaSemanal());
        team.setTelefone(teamUpdate.getTelefone());
        team.setEmail(teamUpdate.getEmail());
        team.setEndereco(teamUpdate.getEndereco());

        if (teamUpdate.getSenha() != null
                && !teamUpdate.getSenha().isBlank()) {
            team.setSenha(teamUpdate.getSenha());
        }

        team.setTipoAcesso(teamUpdate.getTipoAcesso());
        team.setAcessoAtivo(teamUpdate.isAcessoAtivo());
        team.setFotoPerfil(teamUpdate.getFotoPerfil());

        if (teamUpdate.getUltimoAcesso() != null) {
            team.setUltimoAcesso(teamUpdate.getUltimoAcesso());
        }

        if (teamUpdate.getDataCriacaoConta() != null) {
            team.setDataCriacaoConta(teamUpdate.getDataCriacaoConta());
        }

        if (teamUpdate.getDataAlteracaoSenha() != null) {
            team.setDataAlteracaoSenha(teamUpdate.getDataAlteracaoSenha());
        }

        return "Profissional atualizado com sucesso!";
    }

    public String alterarAcesso(Integer id, boolean acessoAtivo) {
        Team team = buscarTeamPorId(id);

        if (team == null) {
            return "Profissional não encontrado!";
        }

        team.setAcessoAtivo(acessoAtivo);

        return acessoAtivo
                ? "Acesso ativado com sucesso!"
                : "Acesso desativado com sucesso!";
    }

    public String deleteTeam(Integer id) {
        if (id == null) {
            return "É necessário informar o ID do profissional!";
        }

        boolean removido = listaTeam.removeIf(
                t -> t.getId() != null && t.getId().equals(id)
        );

        if (removido) {
            return "Profissional deletado com sucesso!";
        }

        return "Profissional não encontrado!";
    }

    public String atualizarDadosPerfil(
            Integer id,
            String nome,
            String email,
            String telefone,
            String fotoPerfil
    ) {
        Team team = buscarTeamPorId(id);

        if (team == null) {
            return "Profissional não encontrado!";
        }

        team.setNome(nome);
        team.setEmail(email);
        team.setTelefone(telefone);
        team.setFotoPerfil(fotoPerfil);

        return "Perfil atualizado com sucesso!";
    }
}
