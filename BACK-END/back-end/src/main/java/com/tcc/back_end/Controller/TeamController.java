
package com.tcc.back_end.Controller;

import com.tcc.back_end.DTO.TeamRequestDTO;
import com.tcc.back_end.DTO.TeamResponseDTO;
import com.tcc.back_end.Service.TeamService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/edu")
@CrossOrigin(origins = "http://localhost:5173")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping("/cadteam")
    public String cadastrarTeam(@RequestBody TeamRequestDTO dto) {
        return teamService.cadastrarTeam(dto);
    }

    @GetMapping("/listteam")
    public List<TeamResponseDTO> listarTeam() {
        return teamService.getListaTeam();
    }

    @GetMapping("/team/{id}")
    public TeamResponseDTO buscarTeamPorId(@PathVariable Integer id) {
        return teamService.buscarTeamPorId(id);
    }

    @GetMapping("/team/matricula/{matricula}")
    public TeamResponseDTO buscarTeamPorMatricula(@PathVariable String matricula) {
        return teamService.buscarTeamPorMatricula(matricula);
    }

    @GetMapping("/team/cpf/{cpf}")
    public TeamResponseDTO buscarTeamPorCpf(@PathVariable String cpf) {
        return teamService.buscarTeamPorCpf(cpf);
    }

    @PutMapping("/upteam/{id}")
    public String atualizarTeam(
            @PathVariable Integer id,
            @RequestBody TeamRequestDTO dto
    ) {
        return teamService.updateTeam(id, dto);
    }

    @PutMapping("/acesso/{id}/{ativo}")
    public String alterarAcesso(
            @PathVariable Integer id,
            @PathVariable boolean ativo
    ) {
        return teamService.alterarAcesso(id, ativo);
    }

    @DeleteMapping("/delteam/{id}")
    public String deletarTeam(@PathVariable Integer id) {
        return teamService.deleteTeam(id);
    }
}
