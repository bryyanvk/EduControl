export const API = "http://localhost:8080/edu";

function chamar(caminho: string, metodo: string, dados: any) {
  const opcoes: any = { method: metodo };
  if (dados !== null) {
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.body = JSON.stringify(dados);
  }
  return fetch(`${API}${caminho}`, opcoes)
    .then((res) => {
      if (res.ok === false) {
        throw new Error("O back recusou o envio.");
      }
      return res.text();
    })
    .then((texto) => {
      if (texto.indexOf("não encontrada") >= 0) {
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
