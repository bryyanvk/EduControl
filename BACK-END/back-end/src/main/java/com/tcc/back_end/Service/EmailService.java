package com.tcc.back_end.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Envio de e-mails do sistema.
 *
 * O envio só funciona quando o SMTP está configurado (variáveis
 * SPRING_MAIL_HOST, SPRING_MAIL_PORT, SPRING_MAIL_USERNAME e
 * SPRING_MAIL_PASSWORD). Sem SMTP, o código NÃO é enviado nem registrado
 * no log, a menos que EDUCONTROL_LOGAR_CODIGO=true (apenas para testes locais).
 */
@Service
public class EmailService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String remetente;
    private final boolean logarCodigo;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSender,
            @Value("${educontrol.mail.remetente:}") String remetente,
            @Value("${educontrol.mail.logar-codigo:false}") boolean logarCodigo
    ) {
        this.mailSender = mailSender;
        this.remetente = remetente;
        this.logarCodigo = logarCodigo;
    }

    public void enviarCodigoRecuperacao(
            String destinatario,
            String nome,
            String codigo,
            int minutosDeValidade
    ) {

        JavaMailSender sender = mailSender.getIfAvailable();

        if (sender == null) {
            log.warn("[EDUCONTROL] SMTP não configurado: e-mail de recuperação não enviado.");

            if (logarCodigo) {
                log.warn("[EDUCONTROL][TESTE] Código de recuperação para {}: {}",
                        destinatario, codigo);
            }

            return;
        }

        SimpleMailMessage mensagem = new SimpleMailMessage();

        if (remetente != null && !remetente.isBlank()) {
            mensagem.setFrom(remetente);
        }

        mensagem.setTo(destinatario);
        mensagem.setSubject("EduControl - código para redefinir sua senha");
        mensagem.setText(
                "Olá, " + (nome != null ? nome : "") + "!\n\n"
                        + "Seu código para redefinir a senha do EduControl é: "
                        + codigo + "\n\n"
                        + "Ele vale por " + minutosDeValidade + " minutos e só pode ser usado uma vez.\n"
                        + "Se você não pediu a redefinição, ignore este e-mail."
        );

        // Envio em segundo plano: o tempo de resposta não revela se o e-mail existe.
        CompletableFuture.runAsync(() -> {
            try {
                sender.send(mensagem);
            } catch (Exception erro) {
                log.error("[EDUCONTROL] Falha ao enviar o e-mail de recuperação: {}",
                        erro.getClass().getSimpleName());
            }
        });
    }
}
