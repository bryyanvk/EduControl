package com.tcc.back_end.Config;

import com.tcc.back_end.Repository.TeamRepository;
import com.tcc.back_end.Service.TeamUserDetailsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Configuration
public class SecurityConfig {

    private static final String FRONT_LOCAL = "http://localhost:5173";

    private final TeamUserDetailsService teamUserDetailsService;
    private final TeamRepository teamRepository;
    private final String tokenDispositivo;

    public SecurityConfig(
            TeamUserDetailsService teamUserDetailsService,
            TeamRepository teamRepository,
            @Value("${educontrol.dispositivo.token:}") String tokenDispositivo
    ) {
        this.teamUserDetailsService = teamUserDetailsService;
        this.teamRepository = teamRepository;
        this.tokenDispositivo = tokenDispositivo == null ? "" : tokenDispositivo.trim();
    }

    // As senhas ficam gravadas como hash BCrypt (ver TeamService e SenhaService).
    @Bean
    public PasswordEncoder passwordEncoder() {

        // BCrypt só aceita senhas de até 72 bytes: acima disso a conferência
        // devolve "senha incorreta" em vez de estourar erro 500.
        BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence senha) {
                return bcrypt.encode(senha);
            }

            @Override
            public boolean matches(CharSequence senha, String hash) {
                if (senha == null
                        || senha.toString().getBytes(StandardCharsets.UTF_8).length > 72) {
                    return false;
                }
                return bcrypt.matches(senha, hash);
            }
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider(
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(teamUserDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    // CORS para o front em http://localhost:5173, inclusive login, perfil e o
    // preflight (OPTIONS), que não leva o cabeçalho Authorization.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // Desenvolvimento: localhost, 127.0.0.1 e IPs de rede local, em qualquer porta
        // (o front pode ser aberto pelo IP da máquina).
        config.setAllowedOriginPatterns(List.of(
                FRONT_LOCAL,
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*:*",
                "http://10.*:*",
                "http://172.*:*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())

                // O front envia o HTTP Basic em toda requisição: sem sessão no servidor.
                .sessionManagement(sessao -> sessao
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // ROTAS PÚBLICAS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/edu/login",
                                "/edu/senha/esqueci",
                                "/edu/senha/redefinir")
                        .permitAll()

                        // CADASTRO DE EQUIPE: público só enquanto não existe nenhum
                        // usuário (criação do primeiro administrador); depois, só ADMINISTRADOR.
                        .requestMatchers(HttpMethod.POST, "/edu/cadteam")
                        .access((autenticacao, contexto) -> {

                            if (teamRepository.getListaTeam().isEmpty()) {
                                return new AuthorizationDecision(true);
                            }

                            var usuario = autenticacao.get();

                            boolean administrador = usuario != null
                                    && usuario.isAuthenticated()
                                    && usuario.getAuthorities().stream()
                                    .anyMatch(a -> a.getAuthority()
                                            .equals("ROLE_ADMINISTRADOR"));

                            return new AuthorizationDecision(administrador);
                        })

                        // LEITOR RFID (Raspberry Pi Pico): não envia HTTP Basic.
                        // Sem token configurado, a rota fica aberta para o leitor.
                        // Com educontrol.dispositivo.token definido, o leitor precisa enviar
                        // o cabeçalho X-Device-Token (ou o usuário estar logado como
                        // ADMINISTRADOR/FUNCIONARIO).
                        .requestMatchers(HttpMethod.POST, "/edu/rfid")
                        .access((autenticacao, contexto) -> {

                            if (tokenDispositivo.isEmpty()) {
                                return new AuthorizationDecision(true);
                            }

                            String enviado = contexto.getRequest()
                                    .getHeader("X-Device-Token");

                            if (enviado != null && MessageDigest.isEqual(
                                    enviado.trim().getBytes(StandardCharsets.UTF_8),
                                    tokenDispositivo.getBytes(StandardCharsets.UTF_8))) {
                                return new AuthorizationDecision(true);
                            }

                            var usuario = autenticacao.get();

                            boolean logado = usuario != null
                                    && usuario.isAuthenticated()
                                    && usuario.getAuthorities().stream()
                                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR")
                                            || a.getAuthority().equals("ROLE_FUNCIONARIO"));

                            return new AuthorizationDecision(logado);
                        })

                        // CONFIGURAÇÕES DA ESCOLA
                        .requestMatchers(HttpMethod.GET, "/edu/config/regras")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")
                        // O tema vale para todos os perfis.
                        .requestMatchers(HttpMethod.GET, "/edu/config/geral")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")
                        .requestMatchers("/edu/config/**")
                        .hasRole("ADMINISTRADOR")

                        // ALUNOS
                        .requestMatchers(HttpMethod.GET,
                                "/edu/listaln", "/edu/encaln/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")
                        .requestMatchers(HttpMethod.POST, "/edu/cadsaln")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/edu/updatealn/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.DELETE, "/edu/deletealn/**")
                        .hasRole("ADMINISTRADOR")

                        // SALAS
                        .requestMatchers(HttpMethod.GET,
                                "/edu/listsala", "/edu/encsala/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")
                        .requestMatchers(HttpMethod.POST, "/edu/cadsala")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/edu/update/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.DELETE, "/edu/delete/**")
                        .hasRole("ADMINISTRADOR")

                        // TURMAS
                        .requestMatchers(HttpMethod.GET,
                                "/edu/listturma", "/edu/encturma/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")
                        .requestMatchers(HttpMethod.POST, "/edu/cadturma")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/edu/updateturma/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.DELETE, "/edu/deleteturma/**")
                        .hasRole("ADMINISTRADOR")

                        // PRESENÇAS E RFID
                        .requestMatchers(HttpMethod.GET,
                                "/edu/listpres", "/edu/ind/**",
                                "/edu/verificar/**", "/edu/hr/**",
                                "/edu/enc/**", "/edu/reg/**",
                                "/edu/rfid/estado")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")

                        .requestMatchers(HttpMethod.POST, "/edu/manual")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")

                        .requestMatchers(HttpMethod.PUT, "/edu/rfid/estado")
                        .hasRole("ADMINISTRADOR")

                        .requestMatchers(HttpMethod.POST, "/edu/faltas/automaticas")
                        .hasRole("ADMINISTRADOR")

                        // NOTIFICAÇÕES
                        .requestMatchers(HttpMethod.GET, "/edu/notificacoes/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")

                        .requestMatchers(HttpMethod.PUT, "/edu/notificacoes/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")

                        .requestMatchers(HttpMethod.POST,
                                "/edu/notificacoes/atualizar",
                                "/edu/notificacoes/teste/**")
                        .hasRole("ADMINISTRADOR")

                        .requestMatchers(HttpMethod.DELETE, "/edu/notificacoes/**")
                        .hasRole("ADMINISTRADOR")

                        // PERFIL
                        .requestMatchers("/edu/perfil/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")

                        // EQUIPE
                        .requestMatchers(HttpMethod.GET,
                                "/edu/listteam", "/edu/team/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR")

                        .requestMatchers("/edu/upteam/**",
                                "/edu/acesso/**", "/edu/delteam/**")
                        .hasRole("ADMINISTRADOR")

                        // ASSISTENTE IA
                        .requestMatchers("/api/ia/**")
                        .hasAnyRole("FUNCIONARIO", "ADMINISTRADOR", "PROFESSOR")

                        // DEMAIS ROTAS
                        .anyRequest().authenticated()
                )

                .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
