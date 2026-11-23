
package com.tcc.back_end.Controller;

import com.tcc.back_end.DTO.PerfilRequestDTO;
import com.tcc.back_end.DTO.PerfilResponseDTO;
import com.tcc.back_end.Service.PerfilService;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/edu/perfil")
public class PerfilController {

    private final PerfilService perfilService;

    public PerfilController(PerfilService perfilService) {
        this.perfilService = perfilService;
    }

    @GetMapping("/{id}")
    public PerfilResponseDTO buscarPerfil(@PathVariable Integer id) {
        return perfilService.buscarPerfil(id);
    }

    @PutMapping("/{id}")
    public String atualizarPerfil(
            @PathVariable Integer id,
            @RequestBody PerfilRequestDTO dto
    ) {
        return perfilService.atualizarPerfil(id, dto);
    }

    @PutMapping("/acesso/{id}")
    public String registrarUltimoAcesso(@PathVariable Integer id) {
        return perfilService.registrarUltimoAcesso(id);
    }
}
