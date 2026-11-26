package com.tcc.back_end.Controller;

import com.tcc.back_end.DTO.SenhaEsqueciRequest;
import com.tcc.back_end.DTO.SenhaRedefinirRequest;
import com.tcc.back_end.Service.SenhaService;
import org.springframework.web.bind.annotation.*;

/**
 * Recuperação de senha (rotas públicas, sem HTTP Basic).
 */
@RestController
@RequestMapping("/edu/senha")
@CrossOrigin(origins = "http://localhost:5173")
public class SenhaController {

    private final SenhaService senhaService;

    public SenhaController(SenhaService senhaService) {
        this.senhaService = senhaService;
    }

    @PostMapping("/esqueci")
    public String esqueci(@RequestBody SenhaEsqueciRequest request) {
        return senhaService.solicitarCodigo(request.getEmail());
    }

    @PostMapping("/redefinir")
    public String redefinir(@RequestBody SenhaRedefinirRequest request) {
        return senhaService.redefinirSenha(
                request.getEmail(),
                request.getCodigo(),
                request.getNovaSenha()
        );
    }
}
