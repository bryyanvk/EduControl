package com.tcc.back_end.Service;

import com.tcc.back_end.Model.Sala;
import com.tcc.back_end.Model.Turma;
import com.tcc.back_end.Repository.SalaRepository;
import com.tcc.back_end.Repository.TurmaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SalaService {

    private SalaRepository salaRepository;
    private TurmaRepository turmaRepository;
    private NotificacaoService notificacaoService;

    public SalaService(
            SalaRepository salaRepository,
            TurmaRepository turmaRepository,
            NotificacaoService notificacaoService
    ) {
        this.salaRepository = salaRepository;
        this.turmaRepository = turmaRepository;
        this.notificacaoService = notificacaoService;
    }

    // Valida as turmas informadas e devolve as turmas reais do sistema.
    // A sala pode ficar sem turma (lista nula ou vazia).
    // numeroSalaIgnorada: sala que está sendo editada (suas turmas atuais não contam como conflito).
    private List<Turma> validarTurmas(List<Turma> informadas, Integer numeroSalaIgnorada) {

        List<Turma> turmasValidas = new ArrayList<>();

        if (informadas == null) {
            return turmasValidas;
        }

        for (Turma turmaInformada : informadas){

            if (turmaInformada == null || turmaInformada.getId() == null){
                throw new IllegalArgumentException("É necessário informar o id da turma!");
            }

            Turma turma = turmaRepository.BuscarTurma(turmaInformada.getId());

            if (turma == null ){
                throw new IllegalArgumentException("Turma não encontrada");
            }

            for(Turma turmaExistente : turmasValidas){
                if (turmaExistente.getId().equals(turma.getId())){
                    throw new IllegalArgumentException("A mesma turma foi informada mais de uma vez");
                }

                if (turmaExistente.getTurno() != null
                        && turmaExistente.getTurno().equalsIgnoreCase(turma.getTurno())){
                    throw new IllegalArgumentException("Já existe turma cadastrada nesse turno");
                }
            }

            for(Sala salaExistente : salaRepository.getListaDeSala()){

                if (numeroSalaIgnorada != null
                        && numeroSalaIgnorada.equals(salaExistente.getNumero())){
                    continue;
                }

                for (Turma turmaExistente : salaExistente.getTurmas()){
                    if (turmaExistente.getId().equals(turma.getId())){
                        throw new IllegalArgumentException("Essa turma ja esta associada a outra sala");
                    }
                }
            }

            turmasValidas.add(turma);
        }

        return turmasValidas;
    }

    public String CadastrarSala(Sala sala){

        if (sala == null) {
            return "É necessário informar os dados da sala!";
        }

        try {
            sala.setTurmas(validarTurmas(sala.getTurmas(), null));
        } catch (IllegalArgumentException erro) {
            return erro.getMessage();
        }

        String resultado = salaRepository.CadrastarSala(sala);

        notificacaoService.registrarNovaSala(sala);

        return resultado;
    }

    public List<Sala> getListaDeSala(){
        return salaRepository.getListaDeSala();
    }

    public Sala BuscarSala(Integer numero){
        return salaRepository.BuscarSala(numero);
    }

    public String updateSala(Integer numero, Sala sala){

        if (sala == null) {
            return "É necessário informar os dados da sala!";
        }

        // Permite vincular (ou remover) turmas depois do cadastro da sala.
        try {
            sala.setTurmas(validarTurmas(sala.getTurmas(), numero));
        } catch (IllegalArgumentException erro) {
            return erro.getMessage();
        }

        return salaRepository.updateSala(numero,sala);
    }

    public String deleteSala(Integer numero){
        return salaRepository.deleteSala(numero);
    }
}
