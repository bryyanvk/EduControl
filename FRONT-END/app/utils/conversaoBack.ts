
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

export const BACK_TEM_CAMPOS_DO_ALUNO = true;

export function alunoParaBack(form: any, turmas: any[]) {
  const turmaSelecionada = turmaPeloNome(form.turma, turmas);

  if (!turmaSelecionada) {
    throw new Error("A turma selecionada não foi encontrada.");
  }

  return {
    nome: form.nome.trim(),
    matricula: form.matricula.trim(),
    dataMatricula: form.dataMatricula,
    dataNascimento: form.dataNascimento,
    cartao: {
      uid: form.cartao.trim().toUpperCase(),
      ativo: true,
    },
    cpf: apenasDigitos(form.cpf),
    turmaId: turmaSelecionada.id,
    turno: form.turno,
    responsasvelNome: form.responsavelNome.trim(),
    parentesco: form.parentesco,
    responsavelTelefone: form.responsavelTelefone,
    responsavelEmail: form.responsavelEmail.trim(),
    endereco: form.endereco.trim(),
  };
}

function textoOuTraco(valor: any) {
  if (valor) {
    return valor;
  }

  return "—";
}

export function alunoDoBack(alunoBack: any) {
  const cartao = alunoBack.cartao?.uid || "";

  const turma =
    alunoBack.turmaNome ||
    (typeof alunoBack.turma === "string"
      ? alunoBack.turma
      : alunoBack.turma?.nome) ||
    "Sem turma";

  const cpf = alunoBack.cpf
    ? formatarCpf(alunoBack.cpf)
    : "";

  const idade = alunoBack.dataNascimento
    ? calcularIdade(alunoBack.dataNascimento)
    : 0;

  return {
    id: alunoBack.id,
    nome: alunoBack.nome,
    cartao,
    turma,
    turmaId: alunoBack.turmaId || alunoBack.turma?.id || null,
    presenca: "—",
    media: "—",
    situacao: "Bom",
    statusHoje: "Pendente",
    detalhes: {
      matricula: textoOuTraco(alunoBack.matricula),
      dataMatricula: alunoBack.dataMatricula || "",
      dataNascimento: alunoBack.dataNascimento,
      idade,
      cpf,
      turno: textoOuTraco(alunoBack.turno),
      responsavelNome: textoOuTraco(
        alunoBack.responsavelNome || alunoBack.responsasvelNome
      ),
      parentesco: textoOuTraco(alunoBack.parentesco),
      responsavelTelefone: alunoBack.responsavelTelefone || "",
      responsavelEmail: textoOuTraco(alunoBack.responsavelEmail),
      endereco: textoOuTraco(alunoBack.endereco),
    },
  };
}