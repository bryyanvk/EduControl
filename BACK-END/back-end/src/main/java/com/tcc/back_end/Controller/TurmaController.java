
package com.tcc.back_end.Controller;

import com.tcc.back_end.DTO.TurmaRequestDTO;
import com.tcc.back_end.DTO.TurmaResponseDTO;
import com.tcc.back_end.Mapper.TurmaMapper;
import com.tcc.back_end.Model.Turma;
import com.tcc.back_end.Service.TurmaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/edu")
public class TurmaController {

    private final TurmaService turmaService;

    public TurmaController(TurmaService turmaService) {
        this.turmaService = turmaService;
    }

    @PostMapping("/cadturma")
    public String CadastrarTurma(@RequestBody TurmaRequestDTO dto) {

        Turma turma = TurmaMapper.toModel(dto);

        return turmaService.CadastrarTurma(turma);
    }

    @GetMapping("/listturma")
    public List<TurmaResponseDTO> getListaDeTurma() {

        return turmaService.getListaDeTurma()
                .stream()
                .map(TurmaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/encturma/{id}")
    public ResponseEntity<TurmaResponseDTO> BuscarTurma(@PathVariable Integer id) {

        Turma turma = turmaService.BuscarTurma(id);

        if (turma == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(TurmaMapper.toResponse(turma));
    }

    @PutMapping("/updateturma/{id}")
    public String updateTurma(
            @PathVariable Integer id,
            @RequestBody TurmaRequestDTO dto) {

        Turma turma = TurmaMapper.toModel(dto);

        turma.setId(id);

        Turma turmaAtual = turmaService.BuscarTurma(id);

        if (turmaAtual != null) {
            turma.setAlunos(turmaAtual.getAlunos());
        }

        return turmaService.updateTurma(id, turma);
    }

    @DeleteMapping("/deleteturma/{id}")
    public String deleteTurma(@PathVariable Integer id) {

        return turmaService.deleteTurma(id);
    }
}
