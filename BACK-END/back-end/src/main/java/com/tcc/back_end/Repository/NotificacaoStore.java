
package com.tcc.back_end.Repository;

import com.tcc.back_end.Model.Notificacao;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class NotificacaoStore {

    private final List<Notificacao> notificacoes = new ArrayList<>();

    public List<Notificacao> listarTodas() {
        return new ArrayList<>(notificacoes);
    }

    public Optional<Notificacao> buscarPorId(String id) {
        return notificacoes.stream()
                .filter(n -> n.getId().equals(id))
                .findFirst();
    }

    public void salvar(Notificacao notificacao) {

        Optional<Notificacao> existente =
                buscarPorId(notificacao.getId());

        if (existente.isPresent()) {

            Notificacao atual = existente.get();

            boolean lida = atual.isLida();

            atual.setTipo(notificacao.getTipo());
            atual.setTitulo(notificacao.getTitulo());
            atual.setMensagem(notificacao.getMensagem());
            atual.setDataHora(notificacao.getDataHora());
            atual.setAlunoId(notificacao.getAlunoId());
            atual.setRota(notificacao.getRota());
            atual.setLida(lida);

            return;
        }

        notificacoes.add(notificacao);
    }

    public void marcarComoLida(String id) {
        buscarPorId(id).ifPresent(notificacao ->
                notificacao.setLida(true)
        );
    }

    public void marcarTodasComoLidas() {
        for (Notificacao notificacao : notificacoes) {
            notificacao.setLida(true);
        }
    }

    public long contarNaoLidas() {
        return notificacoes.stream()
                .filter(notificacao -> !notificacao.isLida())
                .count();
    }

    public void excluir(String id) {
        notificacoes.removeIf(n -> n.getId().equals(id));
    }

    public void limpar() {
        notificacoes.clear();
    }

    public void removerPorPrefixo(String prefixo) {
        notificacoes.removeIf(
                notificacao -> notificacao.getId().startsWith(prefixo)
        );
    }
}
