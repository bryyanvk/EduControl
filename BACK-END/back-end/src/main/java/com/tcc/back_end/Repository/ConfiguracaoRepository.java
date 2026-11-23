
package com.tcc.back_end.Repository;

import com.tcc.back_end.Model.ConfiguracaoGeral;
import com.tcc.back_end.Model.ConfiguracaoRFID;
import com.tcc.back_end.Model.ConfNotificacao;
import com.tcc.back_end.Model.RegrasEscola;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;

@Repository
public class ConfiguracaoRepository {

    private RegrasEscola regrasEscola =
            new RegrasEscola(LocalTime.of(7, 10), 2026, "Matutino");

    private ConfiguracaoGeral configuracaoGeral =
            new ConfiguracaoGeral("auto", "pt-BR");

    private ConfNotificacao notificacao =
            new ConfNotificacao(true, true, true, false, true, false);

    private ConfiguracaoRFID configuracaoRFID =
            new ConfiguracaoRFID(true);

    public RegrasEscola getRegrasEscola() {
        return regrasEscola;
    }

    public void salvarRegrasEscola(RegrasEscola regrasEscola) {
        this.regrasEscola = regrasEscola;
    }

    public ConfiguracaoGeral getConfiguracaoGeral() {
        return configuracaoGeral;
    }

    public void salvarConfiguracaoGeral(ConfiguracaoGeral configuracaoGeral) {
        this.configuracaoGeral = configuracaoGeral;
    }

    public ConfNotificacao getNotificacao() {
        return notificacao;
    }

    public void salvarNotificacao(ConfNotificacao notificacao) {
        this.notificacao = notificacao;
    }

    public ConfiguracaoRFID getConfiguracaoRFID() {
        return configuracaoRFID;
    }

    public void salvarConfiguracaoRFID(ConfiguracaoRFID configuracaoRFID) {
        this.configuracaoRFID = configuracaoRFID;
    }
}
