
package com.tcc.back_end.Repository;

import com.tcc.back_end.Model.Aluno;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Repository
public class AlunoRepository {

    private List<Aluno> listaDeAlunos = new ArrayList<>();
    private int proximoId = 1;

    public boolean matriculaEmUso(String matricula, Integer alunoIdIgnorado) {

        if (matricula == null || matricula.isBlank()) {
            return false;
        }

        String matriculaNormalizada =
                matricula.trim().toLowerCase(Locale.ROOT);

        return listaDeAlunos.stream().anyMatch(aluno -> {

            if (aluno.getMatricula() == null) {
                return false;
            }

            boolean mesmoAluno =
                    alunoIdIgnorado != null &&
                            Objects.equals(aluno.getId(), alunoIdIgnorado);

            if (mesmoAluno) {
                return false;
            }

            return aluno.getMatricula()
                    .trim()
                    .toLowerCase(Locale.ROOT)
                    .equals(matriculaNormalizada);
        });
    }

    public String CadastrarAluno(Aluno aluno) {

        aluno.setId(proximoId++);

        this.listaDeAlunos.add(aluno);

        return "Aluno cadastrado!!";
    }

    public List<Aluno> getListaDeAlunos() {
        return listaDeAlunos;
    }

    public Aluno buscarAlunoPorId(int id) {

        for (Aluno a : listaDeAlunos) {
            if (a.getId() == id) {
                return a;
            }
        }

        return null;
    }

    public String updateAluno(int id, Aluno alunoUpdate) {

        for (Aluno a : listaDeAlunos) {

            if (a.getId() == id) {

                a.setNome(alunoUpdate.getNome());
                a.setMatricula(alunoUpdate.getMatricula());
                a.setDataNascimento(alunoUpdate.getDataNascimento());
                a.setCartao(alunoUpdate.getCartao());
                a.setCpf(alunoUpdate.getCpf());
                a.setTurma(alunoUpdate.getTurma());
                a.setTurno(alunoUpdate.getTurno());
                a.setResponsavelNome(alunoUpdate.getResponsavelNome());
                a.setParentesco(alunoUpdate.getParentesco());
                a.setResponsavelTelefone(alunoUpdate.getResponsavelTelefone());
                a.setResponsavelEmail(alunoUpdate.getResponsavelEmail());
                a.setEndereco(alunoUpdate.getEndereco());
                a.setDataMatricula(alunoUpdate.getDataMatricula());

                return "Dados do aluno atualizados com sucesso!";
            }
        }

        return "Aluno não encontrado!";
    }

    public String deleteAluno(int id) {

        Iterator<Aluno> iterator = listaDeAlunos.iterator();

        while (iterator.hasNext()) {

            Aluno a = iterator.next();

            if (a.getId() == id) {
                iterator.remove();
                return "Aluno deletado com sucesso!";
            }
        }

        return "Aluno não encontrado!";
    }

    public String identificarAlunoPeloCartao(String uid) {

        for (Aluno a : listaDeAlunos) {

            if (a.getCartao() != null &&
                    a.getCartao().getUid() != null &&
                    a.getCartao().getUid().equals(uid)) {

                return a.getNome();
            }
        }

        return "Aluno não encontrado";
    }

    public Aluno buscarAlunoPeloCartao(String uid) {

        for (Aluno a : listaDeAlunos) {

            if (a.getCartao() != null &&
                    a.getCartao().getUid() != null &&
                    a.getCartao().getUid().equals(uid)) {

                return a;
            }
        }

        return null;
    }

    public boolean verificarCartaoAtivo(String uid) {

        for (Aluno a : listaDeAlunos) {

            if (a.getCartao() != null &&
                    a.getCartao().getUid() != null &&
                    a.getCartao().getUid().equals(uid)) {

                return a.getCartao().isAtivo();
            }
        }

        return false;
    }
}
