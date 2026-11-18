
import { calcularIdade, formatarCpf, apenasDigitos } from "~/utils/validacoes";

export function statusDoBack(status: string) {
  if (status === "EM_USO") {
    return "Em uso";
  }
  if (status === "EM_MANUTENCAO") {
    return "Em manutenção";
  }
  return "Disponível";
}

export function statusParaBack(status: string) {
  if (status === "Em uso") {
    return "EM_USO";
  }
  if (status === "Em manutenção") {
    return "EM_MANUTENCAO";
  }
  return "DISPONIVEL";
}

export function salaDoBack(salaBack: any) {
  let nomeDaTurma = "Sem turma";

  if (salaBack.turmas && salaBack.turmas.length > 0) {
    nomeDaTurma = salaBack.turmas
      .map((turma: any) => turma.nome)
      .join(", ");
  }

  return {
    numero: salaBack.numero,
    nome: "Sala " + salaBack.numero,
    capacidade: String(salaBack.capacidade),
    andar: salaBack.andar,
    turma: nomeDaTurma,
    cor: statusDoBack(salaBack.status),
  };
}

export function turmaPeloNome(nome: string, turmas: any[]) {
  for (let i = 0; i < turmas.length; i++) {
    if (turmas[i].nome === nome) {
      return turmas[i];
    }
  }
  return null;
}

export const BACK_TEM_CAMPOS_DO_ALUNO = false;

export function alunoParaBack(
  form: any,
  id: number,
  matricula: string,
  dataMatricula: string,
  turmas: any[]
) {
  const turmaSelecionada = turmaPeloNome(form.turma, turmas);

  return {
    id,
    nome: form.nome.trim(),
    matricula,
    dataNascimento: form.dataNascimento,
    cartao: {
      uid: form.cartao.trim(),
      ativo: true,
    },
    turma: turmaSelecionada
      ? { id: turmaSelecionada.id }
      : null,
  };
}

function textoOuTraco(valor: any) {
  if (valor) {
    return valor;
  }
  return "—";
}

export function alunoDoBack(alunoBack: any) {
  let cartao = "";

  if (alunoBack.cartao) {
    cartao = alunoBack.cartao.uid;
  }

  let turma = "Sem turma";

  if (alunoBack.turma) {
    if (typeof alunoBack.turma === "string") {
      turma = alunoBack.turma;
    } else {
      turma = alunoBack.turma.nome;
    }
  }

  let cpf = "";

  if (alunoBack.cpf) {
    cpf = formatarCpf(alunoBack.cpf);
  }

  let idade = 0;

  if (alunoBack.dataNascimento) {
    idade = calcularIdade(alunoBack.dataNascimento);
  }

  let dataMatricula = "";

  if (alunoBack.dataMatricula) {
    dataMatricula = alunoBack.dataMatricula;
  }

  let telefone = "";

  if (alunoBack.responsavelTelefone) {
    telefone = alunoBack.responsavelTelefone;
  }

  return {
    id: alunoBack.id,
    nome: alunoBack.nome,
    cartao: cartao,
    turma: turma,
    presenca: "—",
    media: "—",
    situacao: "Bom",
    statusHoje: "Pendente",
    detalhes: {
      matricula: textoOuTraco(alunoBack.matricula),
      dataMatricula: dataMatricula,
      dataNascimento: alunoBack.dataNascimento,
      idade: idade,
      cpf: cpf,
      turno: textoOuTraco(alunoBack.turno),
      responsavelNome: textoOuTraco(alunoBack.responsavelNome),
      parentesco: textoOuTraco(alunoBack.parentesco),
      responsavelTelefone: telefone,
      responsavelEmail: textoOuTraco(alunoBack.responsavelEmail),
      endereco: textoOuTraco(alunoBack.endereco),
    },
  };
}
