import { semAcento } from "~/utils/filtros";

const LIMITE_POR_TIPO = 4;

function acha(textos: string[], busca: string) {
  for (let i = 0; i < textos.length; i++) {
    if (semAcento(String(textos[i] ?? "")).includes(busca)) {
      return true;
    }
  }
  return false;
}

// Pesquisa nos dados reais já carregados do back-end (alunos, equipe e salas).
export function buscarTudo(texto: string, podeVer: any, base: any) {
  const busca = semAcento(texto.trim());
  const resultados: any[] = [];
  let totalAlunos = 0;
  let totalFuncionarios = 0;
  let totalSalas = 0;

  if (busca.length < 2) {
    return resultados;
  }

  if (podeVer.alunos) {
    for (const aluno of base.alunos) {
      const d = aluno.detalhes ?? {};
      if (
        totalAlunos < LIMITE_POR_TIPO &&
        acha([aluno.nome, aluno.turma, aluno.cartao, d.matricula, d.responsavelNome], busca)
      ) {
        totalAlunos = totalAlunos + 1;
        resultados.push({ tipo: "Aluno", titulo: aluno.nome, detalhe: aluno.turma, chave: "aluno" + aluno.id, item: aluno });
      }
    }
  }

  if (podeVer.equipe) {
    for (const f of base.funcionarios) {
      if (
        totalFuncionarios < LIMITE_POR_TIPO &&
        acha([f.nome, f.cargo, f.setor, f.vinculo, f.matricula, f.email], busca)
      ) {
        totalFuncionarios = totalFuncionarios + 1;
        resultados.push({ tipo: "Funcionário", titulo: f.nome, detalhe: f.cargo + " · " + f.vinculo, chave: "func" + f.id, item: f });
      }
    }
  }

  if (podeVer.salas) {
    for (const s of base.salas) {
      if (totalSalas < LIMITE_POR_TIPO && acha([s.nome, s.turma, s.andar, s.cor], busca)) {
        totalSalas = totalSalas + 1;
        resultados.push({ tipo: "Sala", titulo: s.nome, detalhe: s.andar + " · " + s.turma, chave: "sala" + s.numero, item: s });
      }
    }
  }

  return resultados;
}
