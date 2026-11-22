
package com.tcc.back_end.Controller;

import com.tcc.back_end.Model.Notificacao;
import com.tcc.back_end.Service.NotificacaoService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.tcc.back_end.Model.Notificacao;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/edu/notificacoes")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    public NotificacaoController(
            NotificacaoService notificacaoService
    ) {
        this.notificacaoService = notificacaoService;
    }

    @GetMapping
    public ResponseEntity<List<Notificacao>> listarNotificacoes() {

        return ResponseEntity.ok(
                notificacaoService.listarNotificacoes()
        );
    }

    @GetMapping("/nao-lidas")
    public ResponseEntity<Map<String, Long>> contarNaoLidas() {

        return ResponseEntity.ok(
                Map.of(
                        "quantidade",
                        notificacaoService.contarNaoLidas()
                )
        );
    }

    @PostMapping("/atualizar")
    public ResponseEntity<Map<String, String>> atualizarNotificacoes() {

        notificacaoService.atualizarNotificacoes();

        return ResponseEntity.ok(
                Map.of(
                        "mensagem",
                        "Notificações atualizadas com sucesso!"
                )
        );
    }

    @PutMapping("/{id}/lida")
    public ResponseEntity<Map<String, String>> marcarComoLida(
            @PathVariable String id
    ) {

        notificacaoService.marcarComoLida(id);

        return ResponseEntity.ok(
                Map.of("mensagem", "Notificação marcada como lida.")
        );
    }

    @PutMapping("/lidas")
    public ResponseEntity<Map<String, String>> marcarTodasComoLidas() {

        notificacaoService.marcarTodasComoLidas();

        return ResponseEntity.ok(
                Map.of("mensagem", "Todas foram marcadas como lidas.")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> excluirNotificacao(
            @PathVariable String id
    ) {

        notificacaoService.excluirNotificacao(id);

        return ResponseEntity.ok(
                Map.of("mensagem", "Notificação excluída.")
        );
    }

    @PostMapping("/teste/{quantidade}")
    public List<Notificacao> simularFaltas(@PathVariable int quantidade) {
        return notificacaoService.simularFaltasConsecutivas(quantidade);
    }

    @DeleteMapping("/teste")
    public String limparTestes() {
        notificacaoService.limparNotificacoesDeTeste();
        return "Notificações de teste removidas.";
    }
}
