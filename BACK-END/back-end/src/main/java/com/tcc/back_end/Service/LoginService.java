package com.tcc.back_end.Service;

import com.tcc.back_end.Model.Team;
import com.tcc.back_end.Repository.TeamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LoginService {

    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginService(
            TeamRepository teamRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Team autenticar(String identificador, String senha) {

        if (identificador == null || identificador.isBlank()) {
            throw naoAutorizado("Informe a matrícula ou o e-mail.");
        }

        if (senha == null || senha.isBlank()) {
            throw naoAutorizado("Informe a senha.");
        }

        String id = identificador.trim();

        Team team = id.contains("@")
                ? teamRepository.buscarTeamPorEmail(id)
                : teamRepository.buscarTeamPorMatricula(id);

        if (team == null) {
            throw naoAutorizado("Usuário não encontrado.");
        }

        if (!team.isAcessoAtivo()) {
            throw naoAutorizado("Acesso desativado.");
        }

        if (team.getSenha() == null
                || !passwordEncoder.matches(senha, team.getSenha())) {
            throw naoAutorizado("Senha incorreta.");
        }

        return team;
    }

    private ResponseStatusException naoAutorizado(String mensagem) {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, mensagem);
    }
}
