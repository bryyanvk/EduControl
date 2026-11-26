package com.tcc.back_end.ia.Service;

import com.tcc.back_end.DTO.TeamResponseDTO;
import com.tcc.back_end.Model.Enum.TipoAcesso;
import com.tcc.back_end.ia.Model.UsuarioIA;

/**
 * Regras de permissão da IA (as mesmas do SecurityConfig, em forma simples):
 *
 * - Contagens da equipe: qualquer perfil (dado agregado, sem dado pessoal).
 * - Telefone de membro da equipe: ADMINISTRADOR e FUNCIONARIO veem o de qualquer
 *   um; PROFESSOR vê somente o próprio.
 * - Ler aparência do sistema: qualquer perfil.
 * - Alterar aparência e notificações: somente ADMINISTRADOR
 *   (igual a PUT /edu/config/**).
 * - Nunca: CPF, endereço, senha, data de nascimento, RFID.
 */
public final class PermissoesIA {

    private PermissoesIA() {
    }

    public static boolean podeVerTelefone(UsuarioIA usuario, TeamResponseDTO alvo) {
        if (usuario == null || usuario.tipoAcesso() == null || alvo == null) {
            return false;
        }

        if (usuario.tipoAcesso() == TipoAcesso.ADMINISTRADOR
                || usuario.tipoAcesso() == TipoAcesso.FUNCIONARIO) {
            return true;
        }

        return usuario.id() != null && usuario.id().equals(alvo.getId());
    }

    public static boolean podeAlterarConfiguracoes(UsuarioIA usuario) {
        return usuario != null
                && usuario.tipoAcesso() == TipoAcesso.ADMINISTRADOR;
    }
}
