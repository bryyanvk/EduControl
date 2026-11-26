package com.tcc.back_end.Controller;

import com.tcc.back_end.DTO.LoginRequest;
import com.tcc.back_end.DTO.LoginResponse;
import com.tcc.back_end.Model.Team;
import com.tcc.back_end.Service.LoginService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/edu")
@CrossOrigin(origins = "http://localhost:5173")
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {

        Team team = loginService.autenticar(
                request.getIdentificador(),
                request.getSenha()
        );

        return new LoginResponse(team);
    }
}
