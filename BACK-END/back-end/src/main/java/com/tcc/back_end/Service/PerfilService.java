
package com.tcc.back_end.Service;

import com.tcc.back_end.DTO.PerfilRequestDTO;
import com.tcc.back_end.DTO.PerfilResponseDTO;
import com.tcc.back_end.Model.Perfil;
import com.tcc.back_end.Model.Team;
import com.tcc.back_end.Repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PerfilService {

    private final TeamRepository teamRepository;

    public PerfilService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public PerfilResponseDTO buscarPerfil(Integer id) {

        if (id == null) {
            return null;
        }

        Team team = teamRepository.buscarTeamPorId(id);

        if (team == null) {
            return null;
        }

        PerfilResponseDTO dto = new PerfilResponseDTO();

        dto.setId(team.getId());
        dto.setNome(team.getNome());
        dto.setEmail(team.getEmail());
        dto.setCargo(team.getCargo());
        dto.setTelefone(team.getTelefone());
        dto.setFotoPerfil(team.getFotoPerfil());
        dto.setTipoAcesso(team.getTipoAcesso());
        dto.setAcessoAtivo(team.isAcessoAtivo());
        dto.setUltimoAcesso(team.getUltimoAcesso());
        dto.setDataCriacaoConta(team.getDataCriacaoConta());
        dto.setDataAlteracaoSenha(team.getDataAlteracaoSenha());

        return dto;
    }

    public String atualizarPerfil(Integer id, PerfilRequestDTO dto) {

        if (id == null || dto == null) {
            return "Dados do perfil não informados!";
        }

        Team teamAtual = teamRepository.buscarTeamPorId(id);

        if (teamAtual == null) {
            return "Perfil não encontrado!";
        }

        if (dto.getNome() == null || dto.getNome().isBlank()) {
            return "O nome é obrigatório!";
        }

        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            return "O e-mail é obrigatório!";
        }

        Team teamEmail =
                teamRepository.buscarTeamPorEmail(dto.getEmail());

        if (teamEmail != null && !teamEmail.getId().equals(id)) {
            return "Esse e-mail já está cadastrado para outro profissional!";
        }

        return teamRepository.atualizarDadosPerfil(
                id,
                dto.getNome(),
                dto.getEmail(),
                dto.getTelefone(),
                dto.getFotoPerfil()
        );
    }

    public String registrarUltimoAcesso(Integer id) {

        if (id == null) {
            return "É necessário informar o ID do profissional!";
        }

        Team team = teamRepository.buscarTeamPorId(id);

        if (team == null) {
            return "Profissional não encontrado!";
        }

        team.setUltimoAcesso(LocalDateTime.now());

        return "Último acesso atualizado!";
    }
}
