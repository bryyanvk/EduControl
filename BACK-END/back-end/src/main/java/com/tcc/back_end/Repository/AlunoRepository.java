
package com.tcc.back_end.Repository;

import com.tcc.back_end.Model.Aluno;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

            if (aluno.isExcluido()) {
                return false;
            }

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

    // Só alunos ativos: alunos excluídos não aparecem em listagens, buscas,
    // presença nem faltas automáticas.
    public List<Aluno> getListaDeAlunos() {

        List<Aluno> ativos = new ArrayList<>();

        for (Aluno a : listaDeAlunos) {
            if (!a.isExcluido()) {
                ativos.add(a);
            }
        }

        return ativos;
    }

    public Aluno buscarAlunoPorId(int id) {

        for (Aluno a : listaDeAlunos) {
            if (a.getId() == id && !a.isExcluido()) {
                return a;
            }
        }

        return null;
    }

    private boolean mesmoUid(String uidCartao, String uid) {
        return uidCartao != null
                && uid != null
                && uidCartao.trim().equalsIgnoreCase(uid.trim());
    }

    // Devolve o aluno ativo que já usa esse UID de cartão (ou null).
    public Aluno buscarDonoDoCartao(String uid, Integer alunoIdIgnorado) {

        if (uid == null || uid.isBlank()) {
            return null;
        }

        for (Aluno a : listaDeAlunos) {

            if (a.isExcluido() || a.getCartao() == null) {
                continue;
            }

            if (alunoIdIgnorado != null
                    && Objects.equals(a.getId(), alunoIdIgnorado)) {
                continue;
            }

            if (mesmoUid(a.getCartao().getUid(), uid)) {
                return a;
            }
        }

        return null;
    }

    public boolean cartaoEmUso(String uid, Integer alunoIdIgnorado) {
        return buscarDonoDoCartao(uid, alunoIdIgnorado) != null;
    }

    public String updateAluno(int id, Aluno alunoUpdate) {

        for (Aluno a : listaDeAlunos) {

            if (a.getId() == id && !a.isExcluido()) {

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

    // Exclusão lógica: o aluno continua guardado só para preservar o histórico
    // de presença, mas deixa de existir para o resto do sistema.
    public String deleteAluno(int id) {

        for (Aluno a : listaDeAlunos) {

            if (a.getId() == id && !a.isExcluido()) {
                a.setExcluido(true);
                a.setExcluidoEm(LocalDateTime.now());
                return "Aluno deletado com sucesso!";
            }
        }

        return "Aluno não encontrado!";
    }

    public String identificarAlunoPeloCartao(String uid) {

        for (Aluno a : listaDeAlunos) {

            if (!a.isExcluido() &&
                    a.getCartao() != null &&
                    a.getCartao().getUid() != null &&
                    a.getCartao().getUid().equals(uid)) {

                return a.getNome();
            }
        }

        return "Aluno não encontrado";
    }

    public Aluno buscarAlunoPeloCartao(String uid) {

        for (Aluno a : listaDeAlunos) {

            if (!a.isExcluido() &&
                    a.getCartao() != null &&
                    a.getCartao().getUid() != null &&
                    a.getCartao().getUid().equals(uid)) {

                return a;
            }
        }

        return null;
    }

    public boolean verificarCartaoAtivo(String uid) {

        for (Aluno a : listaDeAlunos) {

            if (!a.isExcluido() &&
                    a.getCartao() != null &&
                    a.getCartao().getUid() != null &&
                    a.getCartao().getUid().equals(uid)) {

                return a.getCartao().isAtivo();
            }
        }

        return false;
    }
}
