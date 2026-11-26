package com.tcc.back_end.Service;

import com.tcc.back_end.Model.Team;
import com.tcc.back_end.Repository.TeamRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Carrega o usuário da equipe para o HTTP Basic.
 * O identificador pode ser a matrícula ou o e-mail.
 */
@Service
public class TeamUserDetailsService implements UserDetailsService {

    private final TeamRepository teamRepository;

    public TeamUserDetailsService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identificador)
            throws UsernameNotFoundException {

        if (identificador == null || identificador.isBlank()) {
            throw new UsernameNotFoundException("Usuário não encontrado.");
        }

        String id = identificador.trim();

        Team team = id.contains("@")
                ? teamRepository.buscarTeamPorEmail(id)
                : teamRepository.buscarTeamPorMatricula(id);

        if (team == null
                || team.getSenha() == null
                || team.getTipoAcesso() == null) {
            throw new UsernameNotFoundException("Usuário não encontrado.");
        }

        return User.builder()
                .username(team.getMatricula())
                .password(team.getSenha())
                .authorities("ROLE_" + team.getTipoAcesso().name())
                .disabled(!team.isAcessoAtivo())
                .build();
    }
}
