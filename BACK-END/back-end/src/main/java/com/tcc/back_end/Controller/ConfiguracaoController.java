
package com.tcc.back_end.Controller;

import com.tcc.back_end.DTO.RegrasEscolaRequestDTO;
import com.tcc.back_end.DTO.RegrasEscolaResponseDTO;
import com.tcc.back_end.DTO.ConfiguracaoGeralRequestDTO;
import com.tcc.back_end.DTO.ConfiguracaoGeralResponseDTO;
import com.tcc.back_end.DTO.ConfNotificacaoRequestDTO;
import com.tcc.back_end.DTO.ConfNotificacaoResponseDTO;
import com.tcc.back_end.DTO.ConfiguracaoRFIDRequestDTO;
import com.tcc.back_end.DTO.ConfiguracaoRFIDResponseDTO;
import com.tcc.back_end.Service.ConfiguracaoService;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/edu/config")
public class ConfiguracaoController {

    private final ConfiguracaoService configuracaoService;

    public ConfiguracaoController(ConfiguracaoService configuracaoService) {
        this.configuracaoService = configuracaoService;
    }

    @GetMapping("/regras")
    public RegrasEscolaResponseDTO buscarRegrasEscola() {
        return configuracaoService.buscarRegrasEscola();
    }

    @PutMapping("/regras")
    public String salvarRegrasEscola(@RequestBody RegrasEscolaRequestDTO dto) {
        return configuracaoService.salvarRegrasEscola(dto);
    }

    @GetMapping("/geral")
    public ConfiguracaoGeralResponseDTO buscarConfiguracaoGeral() {
        return configuracaoService.buscarConfiguracaoGeral();
    }

    @PutMapping("/geral")
    public String salvarConfiguracaoGeral(@RequestBody ConfiguracaoGeralRequestDTO dto) {
        return configuracaoService.salvarConfiguracaoGeral(dto);
    }

    @GetMapping("/notificacoes")
    public ConfNotificacaoResponseDTO buscarNotificacoes() {
        return configuracaoService.buscarNotificacoes();
    }

    @PutMapping("/notificacoes")
    public String salvarNotificacoes(@RequestBody ConfNotificacaoRequestDTO dto) {
        return configuracaoService.salvarNotificacoes(dto);
    }

    @GetMapping("/rfid")
    public ConfiguracaoRFIDResponseDTO buscarConfiguracaoRFID() {
        return configuracaoService.buscarConfiguracaoRFID();
    }

    @PutMapping("/rfid")
    public String salvarConfiguracaoRFID(@RequestBody ConfiguracaoRFIDRequestDTO dto) {
        return configuracaoService.salvarConfiguracaoRFID(dto);
    }
}
