
package com.tcc.back_end.Repository;

import com.tcc.back_end.Model.RegistroPresença;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Repository
public class PresencaRepository {

    private final List<RegistroPresença> listaRegistro = new ArrayList<>();

    public String RegistrarPresenca(RegistroPresença registroPresença) {
        listaRegistro.add(registroPresença);
        return "Registro salvo com sucesso!!";
    }

    public List<RegistroPresença> getListaRegistro() {
        return listaRegistro;
    }

    public RegistroPresença buscarPorAlunoEData(Integer alunoId, LocalDate data) {

        return listaRegistro.stream()
                .filter(registro ->
                        registro.getAluno() != null
                                && Objects.equals(registro.getAluno().getId(), alunoId)
                                && Objects.equals(registro.getData(), data))
                .findFirst()
                .orElse(null);
    }
}
