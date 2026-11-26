
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const API = `${API_BASE}/edu`;

// Tipos que espelham os DTOs do back-end (pacote com.tcc.back_end).
export type TipoAcesso = "ADMINISTRADOR" | "FUNCIONARIO" | "PROFESSOR";

// DTO/LoginResponse (POST /edu/login).
export type LoginResponse = {
  id: number;
  matricula: string;
  nome: string;
  email: string;
  tipoAcesso: TipoAcesso;
  cargo: string | null;
  telefone: string | null;
  fotoPerfil: string | null;
};

// DTO/TeamResponseDTO (GET /edu/listteam).
export type FuncionarioResponse = {
  id: number;
  matricula: string;
  nome: string;
  dataNascimento: string | null;
  cpf: string | null;
  status: string;
  tipoVinculo: string | null;
  cargo: string;
  setor: string;
  dataAdmissao: string | null;
  jornadaSemanal: number;
  telefone: string;
  email: string;
  endereco: string | null;
  tipoAcesso: TipoAcesso;
  acessoAtivo: boolean;
  fotoPerfil: string | null;
  fimContrato: string | null;
  ultimoAcesso: string | null;
  dataCriacaoConta: string | null;
  dataAlteracaoSenha: string | null;
};

// Model/Perfil (/edu/perfil/{id}).
export type PerfilResponse = {
  nome: string;
  email: string;
  cargo?: string;
  telefone?: string;
  fotoPerfil?: string;
  acessoAtivo?: boolean;
  dataCriacaoConta?: string;
  dataAlteracaoSenha?: string;
  ultimoAcesso?: string;
};

// Model/Notificacao (/edu/notificacoes).
export type NotificacaoResponse = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dataHora: string;
  lida: boolean;
  alunoId: number | null;
  rota: string;
};

const CHAVE_AUTORIZACAO = "educontrol:autorizacao";

export function salvarCredenciais(identificador: string, senha: string) {
  const bytes = new TextEncoder().encode(identificador + ":" + senha);
  let binario = "";
  for (let i = 0; i < bytes.length; i++) {
    binario += String.fromCharCode(bytes[i]);
  }
  sessionStorage.setItem(CHAVE_AUTORIZACAO, "Basic " + btoa(binario));
}

export function limparCredenciais() {
  sessionStorage.removeItem(CHAVE_AUTORIZACAO);
}

export function lerAutorizacao(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(CHAVE_AUTORIZACAO);
}

// Todas as chamadas ao back-end passam por aqui para enviar as credenciais
// da sessão (o back-end protege as rotas com HTTP Basic + perfis).
export function requisitar(url: string, opcoes: any = {}) {
  const autorizacao = lerAutorizacao();
  const headers: any = { ...(opcoes.headers ?? {}) };

  if (autorizacao !== null) {
    headers["Authorization"] = autorizacao;
  }

  return fetch(url, { ...opcoes, headers }).then((res) => {
    if (res.status === 401 && autorizacao !== null) {
      limparCredenciais();
      sessionStorage.removeItem("educontrol:usuario");
      window.location.href = "/";
    }
    return res;
  });
}

// Recuperação de senha (rotas públicas do back-end: /edu/senha/esqueci e /edu/senha/redefinir).
async function chamarPublico(caminho: string, dados: any) {
  const res = await fetch(`${API}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  const texto = await res.text();

  if (!res.ok) {
    throw new Error(texto || "Não foi possível concluir a operação.");
  }

  return texto;
}

export function solicitarRecuperacaoSenha(email: string) {
  return chamarPublico("/senha/esqueci", { email });
}

export function redefinirSenhaComCodigo(email: string, codigo: string, novaSenha: string) {
  return chamarPublico("/senha/redefinir", { email, codigo, novaSenha });
}

export async function loginNoBack(identificador: string, senha: string): Promise<LoginResponse> {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificador, senha }),
  });

  const texto = await res.text();

  if (!res.ok) {
    throw new Error(texto || "Não foi possível entrar. Tente novamente.");
  }

  return JSON.parse(texto);
}

// Mensagem amigável para falhas de autenticação/permissão; senão usa o texto do back.
function mensagemDoErroHttp(status: number, texto: string, padrao: string) {
  if (status === 401) {
    return "Sessão expirada ou credenciais inválidas. Entre novamente.";
  }
  if (status === 403) {
    return "Seu perfil não tem permissão para esta ação.";
  }
  return texto || padrao;
}

// Texto para mostrar na tela: erro de rede usa o texto padrão; os demais, a mensagem real.
export function textoDoErro(erro: any, padrao: string) {
  if (erro instanceof TypeError || !erro?.message) {
    return padrao;
  }
  return erro.message;
}

// Lê uma lista/objeto JSON e falha com mensagem clara se a resposta não for 2xx.
async function lerJson(res: Response, padrao: string) {
  if (!res.ok) {
    throw new Error(mensagemDoErroHttp(res.status, await res.text(), padrao));
  }
  return res.json();
}

function chamar(caminho: string, metodo: string, dados: any) {
  const opcoes: any = { method: metodo };

  if (dados !== null) {
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.body = JSON.stringify(dados);
  }

  return requisitar(`${API}${caminho}`, opcoes).then(async (res) => {
    const texto = await res.text();

    if (!res.ok) {
      throw new Error(
        mensagemDoErroHttp(res.status, texto, `Erro HTTP ${res.status}: ${res.statusText}`)
      );
    }

    const mensagem = texto.toLowerCase();

    const respostasDeErro = [
      "não encontrada",
      "nao encontrada",
      "não encontrado",
      "nao encontrado",
      "é necessário",
      "é necessario",
      "já existe",
      "ja existe",
      "erro",
    ];

    if (respostasDeErro.some((erro) => mensagem.includes(erro))) {
      throw new Error(texto);
    }

    return texto;
  });
}

export function buscarSalas() {
  return requisitar(`${API}/listsala`).then((res) => lerJson(res, "Erro ao buscar salas."));
}

export function buscarTurmas() {
  return requisitar(`${API}/listturma`).then((res) => lerJson(res, "Erro ao buscar turmas."));
}

export function buscarAlunos() {
  return requisitar(`${API}/listaln`).then((res) => lerJson(res, "Erro ao buscar alunos."));
}

export function buscarFuncionarios(): Promise<FuncionarioResponse[]> {
  return requisitar(`${API}/listteam`).then(async (res) => {
    if (!res.ok) {
      throw new Error("Erro ao buscar funcionários.");
    }

    return res.json();
  });
}
export function buscarPerfil(id: number): Promise<PerfilResponse> {
  return requisitar(`${API}/perfil/${id}`).then(async (res) => {
    if (!res.ok) {
      throw new Error("Erro ao buscar os dados do perfil.");
    }

    return res.json();
  });
}

export function atualizarPerfil(id: number, dados: any) {
  return chamar(`/perfil/${id}`, "PUT", dados);
}

export function registrarUltimoAcesso(id: number) {
  return chamar(`/perfil/acesso/${id}`, "PUT", null);
}

export function enviarFuncionario(funcionario: any) {
  return chamar("/cadteam", "POST", funcionario);
}
export function editarFuncionario(id: number, funcionario: any) {
  return chamar(`/upteam/${id}`, "PUT", funcionario);
}

export function excluirFuncionario(id: number) {
  return chamar(`/delteam/${id}`, "DELETE", null);
}

export function enviarAluno(aluno: any) {
  return chamar("/cadsaln", "POST", aluno);
}

export function enviarSala(sala: any) {
  return chamar("/cadsala", "POST", sala);
}

export function editarSala(numero: number, sala: any) {
  return chamar(`/update/${numero}`, "PUT", sala);
}

export function excluirSala(numero: number) {
  return chamar(`/delete/${numero}`, "DELETE", null);
}

export function enviarTurma(turma: any) {
  return chamar("/cadturma", "POST", turma);
}

export function editarTurma(id: number, turma: any) {
  return chamar(`/updateturma/${id}`, "PUT", turma);
}

export function excluirTurma(id: number) {
  return chamar(`/deleteturma/${id}`, "DELETE", null);
}

export function buscarPresencas() {
  return requisitar(`${API}/listpres`).then(async (res) => {
    if (!res.ok) {
      throw new Error("Erro ao buscar registros de presença.");
    }

    return res.json();
  });
}

export function editarAluno(id: number, aluno: any) {
  return chamar(`/updatealn/${id}`, "PUT", aluno);
}

export function excluirAluno(id: number) {
  return chamar(`/deletealn/${id}`, "DELETE", null);
}


export function buscarRegrasEscola() {
  return requisitar(`${API}/config/regras`).then(async (res) => {
    if (!res.ok) throw new Error("Erro ao buscar regras da escola.");
    return res.json();
  });
}

export function salvarRegrasEscola(dados: any) {
  return chamar("/config/regras", "PUT", dados);
}

export function buscarConfiguracaoGeral() {
  return requisitar(`${API}/config/geral`).then(async (res) => {
    if (!res.ok) throw new Error("Erro ao buscar configurações gerais.");
    return res.json();
  });
}

export function salvarConfiguracaoGeral(dados: any) {
  return chamar("/config/geral", "PUT", dados);
}

export function buscarNotificacoes() {
  return requisitar(`${API}/config/notificacoes`).then(async (res) => {
    if (!res.ok) throw new Error("Erro ao buscar notificações.");
    return res.json();
  });
}

export function salvarNotificacoes(dados: any) {
  return chamar("/config/notificacoes", "PUT", dados);
}

export function buscarConfiguracaoRFID() {
  return requisitar(`${API}/config/rfid`).then(async (res) => {
    if (!res.ok) throw new Error("Erro ao buscar configuração RFID.");
    return res.json();
  });
}

export function salvarConfiguracaoRFID(dados: any) {
  return chamar("/config/rfid", "PUT", dados);
}

