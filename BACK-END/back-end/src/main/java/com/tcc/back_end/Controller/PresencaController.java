
package com.tcc.back_end.Controller;

import com.tcc.back_end.DTO.AlunoResponseDTO;
import com.tcc.back_end.DTO.PresencaManualRequestDTO;
import com.tcc.back_end.DTO.PresencaRequestDTO;
import com.tcc.back_end.DTO.PresencaResponseDTO;
import com.tcc.back_end.Model.Enum.StatusPresenca;
import com.tcc.back_end.Service.PresencaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/edu")
public class PresencaController {

    private final PresencaService presencaService;

    public PresencaController(PresencaService presencaService) {
        this.presencaService = presencaService;
    }

    @GetMapping("/listpres")
    public List<PresencaResponseDTO> getListaRegistro() {
        return presencaService.getListaRegistro();
    }

    @GetMapping("/ind/{uid}")
    public String identificarAlunoPeloCartao(@PathVariable String uid) {
        return presencaService.identificarAlunoPeloCartao(uid);
    }

    @GetMapping("/verificar/{uid}")
    public boolean verificarCartaoAtivo(@PathVariable String uid) {
        return presencaService.verificarCartaoAtivo(uid);
    }

    @GetMapping("/hr/{horario}")
    public StatusPresenca definirStatusPresença(
            @PathVariable LocalTime horario) {

        return presencaService.definirStatusPresença(horario);
    }

    @GetMapping("/enc/{uid}")
    public ResponseEntity<AlunoResponseDTO> buscarAlunoPeloCartao(
            @PathVariable String uid) {

        AlunoResponseDTO aluno =
                presencaService.buscarAlunoPeloCartao(uid);

        if (aluno == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(aluno);
    }

    @GetMapping("/reg/{uid}")
    public String registrarPresenca(@PathVariable String uid) {
        return presencaService.registrarPresenca(uid);
    }

    @PostMapping("/rfid")
    public String registrarPresencaRFID(
            @RequestBody PresencaRequestDTO dados) {

        if (dados == null
                || dados.getUid() == null
                || dados.getUid().isBlank()) {

            return "UID não informado";
        }

        return presencaService.registrarPresenca(dados.getUid());
    }

    // ==============================
    // CONTROLE DO LEITOR RFID
    // ==============================

    @GetMapping("/rfid/estado")
    public ResponseEntity<Boolean> consultarEstadoRfid() {

        return ResponseEntity.ok(
                presencaService.isLeitorRfidAtivo()
        );
    }

    @PutMapping("/rfid/estado")
    public ResponseEntity<String> definirEstadoRfid(
            @RequestParam boolean ativo) {

        presencaService.definirEstadoRfid(ativo);

        return ResponseEntity.ok(
                ativo
                        ? "Leitor RFID ativado!"
                        : "Leitor RFID desativado!"
        );
    }

    // ==============================
    // FALTAS AUTOMÁTICAS
    // ==============================

    @PostMapping("/faltas/automaticas")
    public String registrarFaltasAutomaticas() {

        presencaService.registrarFaltasAutomaticas();

        return "Faltas automáticas processadas com sucesso!";
    }

    // ==============================
    // REGISTRO MANUAL
    // ==============================

    @PostMapping("/manual")
    public ResponseEntity<String> registrarPresencaManual(
            @RequestBody PresencaManualRequestDTO dados) {

        try {

            String resposta =
                    presencaService.registrarPresencaManual(dados);

            return ResponseEntity.ok(resposta);

        } catch (org.springframework.web.server.ResponseStatusException erro) {

            return ResponseEntity
                    .status(erro.getStatusCode())
                    .body(erro.getReason());
        }
    }
}
