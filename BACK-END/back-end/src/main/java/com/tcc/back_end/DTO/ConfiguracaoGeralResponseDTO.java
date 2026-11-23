
package com.tcc.back_end.DTO;

public class ConfiguracaoGeralResponseDTO {

    private String aparencia;
    private String idioma;

    public ConfiguracaoGeralResponseDTO() {
    }

    public String getAparencia() {
        return aparencia;
    }

    public void setAparencia(String aparencia) {
        this.aparencia = aparencia;
    }

    public String getIdioma() {
        return idioma;
    }

    public void setIdioma(String idioma) {
        this.idioma = idioma;
    }
}
