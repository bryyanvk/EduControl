
export const API = "http://localhost:8080/edu";

function chamar(caminho: string, metodo: string, dados: any) {
  const opcoes: any = { method: metodo };

  if (dados !== null) {
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.body = JSON.stringify(dados);
  }

  return fetch(`${API}${caminho}`, opcoes).then(async (res) => {
    const texto = await res.text();

    if (!res.ok) {
      throw new Error(texto || `Erro HTTP ${res.status}: ${res.statusText}`);
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
  return fetch(`${API}/listsala`).then((res) => res.json());
}

export function buscarTurmas() {
  return fetch(`${API}/listturma`).then((res) => res.json());
}

export function buscarAlunos() {
  return fetch(`${API}/listaln`).then((res) => res.json());
}

export function buscarFuncionarios() {
  return fetch(`${API}/listteam`).then(async (res) => {
    if (!res.ok) {
      throw new Error("Erro ao buscar funcionários.");
    }

    return res.json();
  });
}
export function buscarPerfil(id: number) {
  return fetch(`${API}/perfil/${id}`).then(async (res) => {
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
  return fetch(`${API}/listpres`).then(async (res) => {
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
  return fetch(`${API}/config/regras`).then(async (res) => {
    if (!res.ok) throw new Error("Erro ao buscar regras da escola.");
    return res.json();
  });
}

export function salvarRegrasEscola(dados: any) {
  return chamar("/config/regras", "PUT", dados);
}

export function buscarConfiguracaoGeral() {
  return fetch(`${API}/config/geral`).then(async (res) => {
    if (!res.ok) throw new Error("Erro ao buscar configurações gerais.");
    return res.json();
  });
}

export function salvarConfiguracaoGeral(dados: any) {
  return chamar("/config/geral", "PUT", dados);
}

export function buscarNotificacoes() {
  return fetch(`${API}/config/notificacoes`).then(async (res) => {
    if (!res.ok) throw new Error("Erro ao buscar notificações.");
    return res.json();
  });
}

export function salvarNotificacoes(dados: any) {
  return chamar("/config/notificacoes", "PUT", dados);
}

export function buscarConfiguracaoRFID() {
  return fetch(`${API}/config/rfid`).then(async (res) => {
    if (!res.ok) throw new Error("Erro ao buscar configuração RFID.");
    return res.json();
  });
}

export function salvarConfiguracaoRFID(dados: any) {
  return chamar("/config/rfid", "PUT", dados);
}

