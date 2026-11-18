package com.tcc.back_end.Controller;

import com.tcc.back_end.DTO.AlunoRequestDTO;
import com.tcc.back_end.DTO.AlunoResponseDTO;
import com.tcc.back_end.Service.AlunoService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/edu")
public class AlunoController {

    private final AlunoService alunoservice;

    public AlunoController(AlunoService alunoservice) {
        this.alunoservice = alunoservice;
    }

    @PostMapping("/cadsaln")
    public String CadastrarAluno(@RequestBody AlunoRequestDTO dto) {
        return alunoservice.CadastrarAluno(dto);
    }

    @GetMapping("/listaln")
    public List<AlunoResponseDTO> getListaDeAlunos() {
        return alunoservice.getListaDeAlunos();
    }

    @GetMapping("/encaln/{id}")
    public ResponseEntity<AlunoResponseDTO> buscarAlunoPorId(
            @PathVariable int id) {

        AlunoResponseDTO aluno = alunoservice.buscarAlunoPorId(id);

        if (aluno == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(aluno);
    }

    @PutMapping("/updatealn/{id}")
    public String updateAluno(
            @PathVariable int id,
            @RequestBody AlunoRequestDTO dto) {

        return alunoservice.updateAluno(id, dto);
    }

    @DeleteMapping("/deletealn/{id}")
    public String deleteAluno(@PathVariable int id) {
        return alunoservice.deleteAluno(id);
    }
}