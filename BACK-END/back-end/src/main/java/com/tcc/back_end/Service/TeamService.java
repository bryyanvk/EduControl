
package com.tcc.back_end.Service;

import com.tcc.back_end.DTO.TeamRequestDTO;
import com.tcc.back_end.DTO.TeamResponseDTO;
import com.tcc.back_end.Model.Enum.TipoAcesso;
import com.tcc.back_end.Model.Team;
import com.tcc.back_end.Repository.TeamRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    private final NotificacaoService notificacaoService;

    private static final String MENSAGEM_SENHA_LONGA =
            "É necessário que a senha tenha no máximo 72 caracteres!";

    // O BCrypt só aceita senhas de até 72 bytes.
    private boolean senhaLonga(String senha) {
        return senha.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72;
    }

    public TeamService(
            TeamRepository teamRepository,
            NotificacaoService notificacaoService
    ) {
        this.teamRepository = teamRepository;
        this.notificacaoService = notificacaoService;
    }

    public String cadastrarTeam(TeamRequestDTO dto) {

        if (dto == null) {
            return "Os dados do profissional não foram informados!";
        }

        if (dto.getMatricula() == null || dto.getMatricula().isBlank()) {
            return "É necessário informar a matrícula!";
        }

        if (teamRepository.buscarTeamPorMatricula(dto.getMatricula()) != null) {
            return "Essa matrícula já está cadastrada!";
        }

        if (dto.getCpf() == null || dto.getCpf().isBlank()) {
            return "É necessário informar o CPF!";
        }

        if (teamRepository.buscarTeamPorCpf(dto.getCpf()) != null) {
            return "Esse CPF já está cadastrado!";
        }

        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            return "É necessário informar o e-mail!";
        }

        if (teamRepository.buscarTeamPorEmail(dto.getEmail()) != null) {
            return "Esse e-mail já está cadastrado!";
        }

        if (dto.getTipoAcesso() == null) {
            return "É necessário definir o tipo de acesso!";
        }

        // O cadastro é público só para criar o primeiro usuário (ver SecurityConfig).
        if (teamRepository.getListaTeam().isEmpty()
                && dto.getTipoAcesso() != TipoAcesso.ADMINISTRADOR) {
            return "É necessário que o primeiro usuário do sistema seja ADMINISTRADOR!";
        }

        if (dto.getSenha() == null || dto.getSenha().isBlank()) {
            return "É necessário informar a senha!";
        }

        if (senhaLonga(dto.getSenha())) {
            return MENSAGEM_SENHA_LONGA;
        }

        Team team = new Team();

        team.setMatricula(dto.getMatricula());
        team.setNome(dto.getNome());
        team.setDataNascimento(dto.getDataNascimento());
        team.setCpf(dto.getCpf());
        team.setStatus(dto.getStatus());
        team.setTipoVinculo(dto.getTipoVinculo());
        team.setCargo(dto.getCargo());
        team.setSetor(dto.getSetor());
        team.setDataAdmissao(dto.getDataAdmissao());
        team.setJornadaSemanal(dto.getJornadaSemanal());
        team.setTelefone(dto.getTelefone());
        team.setEmail(dto.getEmail());
        team.setEndereco(dto.getEndereco());
        team.setSenha(passwordEncoder.encode(dto.getSenha()));
        team.setTipoAcesso(dto.getTipoAcesso());
        team.setAcessoAtivo(true);
        team.setFotoPerfil(dto.getFotoPerfil());
        team.setFimContrato(dto.getFimContrato());
        team.setDataCriacaoConta(LocalDateTime.now());

        String resultado = teamRepository.cadastrarTeam(team);

        if ("Profissional cadastrado com sucesso!".equals(resultado)) {
            notificacaoService.registrarNovoFuncionario(team);
        }

        return resultado;
    }

    public List<TeamResponseDTO> getListaTeam() {
        return teamRepository.getListaTeam()
                .stream()
                .map(this::converterParaResponse)
                .collect(Collectors.toList());
    }

    public TeamResponseDTO buscarTeamPorId(Integer id) {
        Team team = teamRepository.buscarTeamPorId(id);

        if (team == null) {
            return null;
        }

        return converterParaResponse(team);
    }

    public TeamResponseDTO buscarTeamPorMatricula(String matricula) {
        Team team = teamRepository.buscarTeamPorMatricula(matricula);

        if (team == null) {
            return null;
        }

        return converterParaResponse(team);
    }

    public TeamResponseDTO buscarTeamPorCpf(String cpf) {
        Team team = teamRepository.buscarTeamPorCpf(cpf);

        if (team == null) {
            return null;
        }

        return converterParaResponse(team);
    }

    public String updateTeam(Integer id, TeamRequestDTO dto) {

        if (id == null || dto == null) {
            return "É necessário informar os dados do profissional!";
        }

        Team teamAtual = teamRepository.buscarTeamPorId(id);

        if (teamAtual == null) {
            return "Profissional não encontrado!";
        }

        if (dto.getMatricula() == null || dto.getMatricula().isBlank()) {
            return "É necessário informar a matrícula!";
        }

        Team teamMatricula =
                teamRepository.buscarTeamPorMatricula(dto.getMatricula());

        if (teamMatricula != null && !teamMatricula.getId().equals(id)) {
            return "Essa matrícula já está cadastrada para outro profissional!";
        }

        if (dto.getCpf() == null || dto.getCpf().isBlank()) {
            return "É necessário informar o CPF!";
        }

        Team teamCpf = teamRepository.buscarTeamPorCpf(dto.getCpf());

        if (teamCpf != null && !teamCpf.getId().equals(id)) {
            return "Esse CPF já está cadastrado para outro profissional!";
        }

        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            return "É necessário informar o e-mail!";
        }

        Team teamEmail = teamRepository.buscarTeamPorEmail(dto.getEmail());

        if (teamEmail != null && !teamEmail.getId().equals(id)) {
            return "Esse e-mail já está cadastrado para outro profissional!";
        }

        if (dto.getTipoAcesso() == null) {
            return "É necessário informar o tipo de acesso!";
        }

        if (dto.getSenha() != null && senhaLonga(dto.getSenha())) {
            return MENSAGEM_SENHA_LONGA;
        }

        Team teamUpdate = new Team();

        teamUpdate.setMatricula(dto.getMatricula());
        teamUpdate.setNome(dto.getNome());
        teamUpdate.setDataNascimento(dto.getDataNascimento());
        teamUpdate.setCpf(dto.getCpf());
        teamUpdate.setStatus(dto.getStatus());
        teamUpdate.setTipoVinculo(dto.getTipoVinculo());
        teamUpdate.setCargo(dto.getCargo());
        teamUpdate.setSetor(dto.getSetor());
        teamUpdate.setDataAdmissao(dto.getDataAdmissao());
        teamUpdate.setJornadaSemanal(dto.getJornadaSemanal());
        teamUpdate.setTelefone(dto.getTelefone());
        teamUpdate.setEmail(dto.getEmail());
        teamUpdate.setEndereco(dto.getEndereco());
        teamUpdate.setTipoAcesso(dto.getTipoAcesso());
        teamUpdate.setAcessoAtivo(teamAtual.isAcessoAtivo());
        teamUpdate.setFotoPerfil(dto.getFotoPerfil());
        teamUpdate.setFimContrato(dto.getFimContrato());

        boolean senhaAlterada =
                dto.getSenha() != null && !dto.getSenha().isBlank();

        if (senhaAlterada) {
            teamUpdate.setSenha(passwordEncoder.encode(dto.getSenha()));
            teamUpdate.setDataAlteracaoSenha(LocalDateTime.now());
        }

        String resultado = teamRepository.updateTeam(id, teamUpdate);

        if (senhaAlterada
                && "Profissional atualizado com sucesso!".equals(resultado)) {
            notificacaoService.registrarAlteracaoSenha(teamAtual);
        }

        return resultado;
    }

    public String deleteTeam(Integer id) {

        if (id == null) {
            return "É necessário informar o ID do profissional!";
        }

        if (teamRepository.buscarTeamPorId(id) == null) {
            return "Profissional não encontrado!";
        }

        return teamRepository.deleteTeam(id);
    }

    public String alterarAcesso(Integer id, boolean acessoAtivo) {

        if (id == null) {
            return "É necessário informar o ID do profissional!";
        }

        return teamRepository.alterarAcesso(id, acessoAtivo);
    }

    private TeamResponseDTO converterParaResponse(Team team) {

        TeamResponseDTO dto = new TeamResponseDTO();

        dto.setId(team.getId());
        dto.setMatricula(team.getMatricula());
        dto.setNome(team.getNome());
        dto.setDataNascimento(team.getDataNascimento());
        dto.setCpf(team.getCpf());
        dto.setStatus(team.getStatus());
        dto.setTipoVinculo(team.getTipoVinculo());
        dto.setCargo(team.getCargo());
        dto.setSetor(team.getSetor());
        dto.setDataAdmissao(team.getDataAdmissao());
        dto.setJornadaSemanal(team.getJornadaSemanal());
        dto.setTelefone(team.getTelefone());
        dto.setEmail(team.getEmail());
        dto.setEndereco(team.getEndereco());
        dto.setTipoAcesso(team.getTipoAcesso());
        dto.setAcessoAtivo(team.isAcessoAtivo());
        dto.setFotoPerfil(team.getFotoPerfil());
        dto.setFimContrato(team.getFimContrato());
        dto.setUltimoAcesso(team.getUltimoAcesso());
        dto.setDataCriacaoConta(team.getDataCriacaoConta());
        dto.setDataAlteracaoSenha(team.getDataAlteracaoSenha());

        return dto;
    }
}
