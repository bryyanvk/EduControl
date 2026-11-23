
package com.tcc.back_end.DTO;

public class ConfiguracaoRFIDRequestDTO {

    private boolean leitorAtivo;

    public ConfiguracaoRFIDRequestDTO() {
    }

    public boolean isLeitorAtivo() {
        return leitorAtivo;
    }

    public void setLeitorAtivo(boolean leitorAtivo) {
        this.leitorAtivo = leitorAtivo;
    }
}
