import { lerLista, salvarLista } from "~/utils/armazenamento";

const CHAVE = "educontrol:turmas-novas";

export function lerTurmasNovas() {
  return lerLista(CHAVE);
}

export function cadastrarTurma(dados: any) {
  const novas = lerTurmasNovas();
  let maiorId = 0;
  for (let i = 0; i < novas.length; i++) {
    if (novas[i].id > maiorId) {
      maiorId = novas[i].id;
    }
  }
  const turma = {
    id: maiorId + 1,
    nome: dados.nome.trim(),
    curso: dados.curso.trim(),
  };
  novas.push(turma);
  if (salvarLista(CHAVE, novas) === false) {
    return null;
  }
  return turma;
}
