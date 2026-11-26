const PERMISSOES_SECRETARIO = [
  "pagina.inicio",
  "pagina.relatorios",
  "pagina.ia",
  "pagina.team",
  "pagina.presenca",
  "pagina.salas",
  "pagina.alunos",
  "pagina.configuracoes",
  "pagina.perfil",
  "alunos.cadastrar",
  "alunos.editar",
  "presenca.registrar",
  "presenca.corrigir",
  "perfil.editarProprio",
  "perfil.alterarSenha",
];

const PERMISSOES_PROFESSOR = [
  "pagina.inicio",
  "pagina.ia",
  "pagina.presenca",
  "pagina.salas",
  "pagina.alunos",
  "pagina.perfil",
  "perfil.editarProprio",
  "perfil.alterarSenha",
];

export function temPermissao(perfil: string | null, permissao: string) {
  if (perfil === "administrador") {
    return true;
  }
  if (perfil === "secretario") {
    return PERMISSOES_SECRETARIO.includes(permissao);
  }
  if (perfil === "professor") {
    return PERMISSOES_PROFESSOR.includes(permissao);
  }
  return false;
}

export function nomeDoPerfil(perfil: string) {
  if (perfil === "administrador") {
    return "Administrador";
  }
  if (perfil === "secretario") {
    return "Secretário";
  }
  if (perfil === "professor") {
    return "Professor";
  }
  return "";
}
