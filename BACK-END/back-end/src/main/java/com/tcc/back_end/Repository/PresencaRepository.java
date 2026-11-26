
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

    // Registros dos alunos ativos. Os de alunos excluídos continuam guardados
    // (histórico), mas não aparecem na presença, nos indicadores nem nos alertas.
    public List<RegistroPresença> getListaRegistro() {

        List<RegistroPresença> visiveis = new ArrayList<>();

        for (RegistroPresença registro : listaRegistro) {

            if (registro.getAluno() == null
                    || !registro.getAluno().isExcluido()) {
                visiveis.add(registro);
            }
        }

        return visiveis;
    }

    // Histórico completo, inclusive de alunos excluídos.
    public List<RegistroPresença> getHistoricoCompleto() {
        return new ArrayList<>(listaRegistro);
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
