package com.tcc.back_end.ia.Model;

import com.tcc.back_end.Model.Enum.TipoAcesso;

/** Usuário autenticado (Basic Auth) que está falando com a IA. */
public record UsuarioIA(
        Integer id,
        String matricula,
        String nome,
        TipoAcesso tipoAcesso
) {
}
