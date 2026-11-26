import { lerAutorizacao, limparCredenciais, loginNoBack, salvarCredenciais } from "~/services/api";

export type Usuario = {
  id: number | null;
  matricula: string;
  nome: string;
  email: string;
  perfil: string;
  tipoAcesso: string;
  cargo: string;
  telefone: string;
  fotoPerfil: string;
  membroDesde: string;
  senhaAlteradaEm: string;
  ultimoAcessoEm: string;
};

const CHAVE = "educontrol:usuario";

// Tipos de acesso do back-end -> perfis usados pelas permissões do front.
function perfilDoTipoAcesso(tipoAcesso: string) {
  if (tipoAcesso === "ADMINISTRADOR") {
    return "administrador";
  }
  if (tipoAcesso === "FUNCIONARIO") {
    return "secretario";
  }
  if (tipoAcesso === "PROFESSOR") {
    return "professor";
  }
  return "";
}

export async function fazerLogin(identificador: string, senha: string) {
  const idLimpo = identificador.trim();
  const dados = await loginNoBack(idLimpo, senha);

  const perfil = perfilDoTipoAcesso(String(dados.tipoAcesso));
  if (perfil === "") {
    throw new Error("Tipo de acesso não reconhecido para esta conta.");
  }

  salvarCredenciais(idLimpo, senha);

  const usuario: Usuario = {
    id: dados.id,
    matricula: dados.matricula,
    nome: dados.nome,
    email: dados.email,
    perfil,
    tipoAcesso: String(dados.tipoAcesso),
    cargo: dados.cargo ?? "",
    telefone: dados.telefone ?? "",
    fotoPerfil: dados.fotoPerfil ?? "",
    membroDesde: "",
    senhaAlteradaEm: "",
    ultimoAcessoEm: new Date().toISOString(),
  };

  salvarUsuario(usuario);
  // Avisa o app (ex.: tema) que há uma sessão ativa e as rotas protegidas já podem ser lidas.
  window.dispatchEvent(new Event("educontrol-login"));
  return usuario;
}

export function salvarUsuario(usuario: Usuario) {
  sessionStorage.setItem(CHAVE, JSON.stringify(usuario));
}

export function pegarUsuario(): Usuario | null {
  if (typeof window === "undefined") {
    return null;
  }

  const texto = sessionStorage.getItem(CHAVE);
  if (texto === null) {
    return null;
  }

  // Sessão sem credenciais (ex.: aberta antes do login real) não é válida:
  // o back-end responderia 401 em todas as chamadas.
  if (lerAutorizacao() === null) {
    sessionStorage.removeItem(CHAVE);
    return null;
  }

  return JSON.parse(texto);
}

export function sairDaConta() {
  sessionStorage.removeItem(CHAVE);
  limparCredenciais();
}
