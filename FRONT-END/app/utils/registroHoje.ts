
import { todosOsAlunos } from "~/utils/alunosCadastrados";
import { PRESENCAS_FICTICIAS } from "~/data/presencasFicticias";
import { textoDaData } from "~/utils/filtros";

import { API, requisitar } from "~/services/api";

export interface AlunoAPI {
  id: number;
  nome: string;
  matricula: string;
  turmaId: number;
  turmaNome: string;
  dataNascimento: string;
  cartao?: {
    uid: string;
    ativo: boolean;
  };
}

export interface PresencaAPI {
  id: number;
  data: string;
  horario: string | null;
  status: string;
  tipo: string;
  origem?: "RFID" | "MANUAL" | null;
  alunoId: number;
  alunoNome: string;
  matricula: string;
  turmaId: number;
  turmaNome: string;
}

async function tratarResposta(resposta: Response) {
  if (!resposta.ok) {
    const mensagem = await resposta.text();

    if (resposta.status === 403) {
      throw new Error("Seu perfil não tem permissão para esta ação.");
    }

    if (resposta.status === 401) {
      throw new Error("Sessão expirada ou credenciais inválidas. Entre novamente.");
    }

    throw new Error(
      mensagem || `Erro HTTP ${resposta.status}`
    );
  }

  return resposta;
}

function dataAtualISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

// CONVERTER STATUS DO JAVA PARA O REACT

export function converterStatus(status: string) {
  const mapa: Record<string, string> = {
    PRESENTE: "Presente",
    ATRASADO: "Atrasado",
    JUSTIFICADO: "Justificado",
    FALTA: "Ausente",
    AUSENTE: "Ausente",
    PENDENTE: "Pendente",
  };

  return mapa[status] ?? status;
}

// BUSCAR ALUNOS NO BACKEND

export async function buscarAlunosAPI(): Promise<AlunoAPI[]> {
  const resposta = await requisitar(`${API}/listaln`);

  await tratarResposta(resposta);

  return resposta.json();
}

// BUSCAR PRESENÇAS NO BACKEND

export async function buscarPresencasAPI(): Promise<PresencaAPI[]> {
  const resposta = await requisitar(`${API}/listpres`);

  await tratarResposta(resposta);

  return resposta.json();
}

// REGISTRAR PRESENÇA MANUAL

export async function registrarPresencaManualAPI(
  alunoId: number,
  status: string,
  horario: string
) {
  const statusBackend: Record<string, string> = {
    Presente: "PRESENTE",
    Atrasado: "ATRASADO",
    Justificado: "JUSTIFICADO",
    Ausente: "FALTA",
  };

  const statusConvertido = statusBackend[status];

  if (!statusConvertido) {
    throw new Error(`Status inválido: ${status}`);
  }

  const resposta = await requisitar(`${API}/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      alunoId,
      data: dataAtualISO(),
      horario: horario ? `${horario}:00` : null,
      status: statusConvertido,
    }),
  });

  await tratarResposta(resposta);

  return resposta.text();
}

// REGISTRAR PRESENÇA PELO RFID

export async function registrarPresencaRFIDAPI(uid: string) {
  const resposta = await requisitar(`${API}/rfid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid }),
  });

  await tratarResposta(resposta);

  return resposta.text();
}

// CONSULTAR ALUNO PELO CARTÃO

export async function buscarAlunoPorCartaoAPI(uid: string) {
  const resposta = await requisitar(
    `${API}/enc/${encodeURIComponent(uid)}`
  );

  if (resposta.status === 404) {
    return null;
  }

  await tratarResposta(resposta);

  return resposta.json();
}

// FUNÇÕES ANTIGAS — MANTIDAS TEMPORARIAMENTE

const CHAVE = "educontrol:registros-de-hoje";

export function lerRegistros() {
  if (typeof window === "undefined") {
    return {};
  }

  const texto = localStorage.getItem(CHAVE);

  if (texto === null) {
    return {};
  }

  let dados: any = {};

  try {
    dados = JSON.parse(texto);
  } catch {
    return {};
  }

  if (dados.data !== textoDaData(new Date())) {
    return {};
  }

  return dados.registros;
}

export function salvarRegistros(registros: any) {
  const dados = {
    data: textoDaData(new Date()),
    registros,
  };

  localStorage.setItem(CHAVE, JSON.stringify(dados));
}

export function horaAgora() {
  const agora = new Date();
  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");

  return hora + ":" + minuto;
}

export function alunosDeHoje() {
  const registros: any = lerRegistros();
  const textoHoje = textoDaData(new Date());
  const resultado = [];
  const alunos = todosOsAlunos();

  for (let i = 0; i < alunos.length; i++) {
    const aluno = alunos[i];

    let entradaHoje = "";

    for (let j = 0; j < PRESENCAS_FICTICIAS.length; j++) {
      const linha = PRESENCAS_FICTICIAS[j];

      if (linha.data === textoHoje && linha.nome === aluno.nome) {
        if (linha.entrada !== "—") {
          entradaHoje = linha.entrada;
        }
      }
    }

    let statusHoje = aluno.statusHoje;

    if (registros[aluno.id] !== undefined) {
      statusHoje = registros[aluno.id].status;
      entradaHoje = registros[aluno.id].entrada;
    }

    resultado.push({
      ...aluno,
      statusHoje,
      entradaHoje,
    });
  }

  return resultado;
}

export function presencasAtuais() {
  const registros: any = lerRegistros();
  const textoHoje = textoDaData(new Date());
  const resultado = [];

  for (let i = 0; i < PRESENCAS_FICTICIAS.length; i++) {
    const linha = PRESENCAS_FICTICIAS[i];

    if (linha.data === textoHoje && registros[linha.id] !== undefined) {
      let entrada = registros[linha.id].entrada;

      if (entrada === "") {
        entrada = "—";
      }

      resultado.push({
        ...linha,
        status: registros[linha.id].status,
        entrada,
      });
    } else {
      resultado.push(linha);
    }
  }

  const alunos = todosOsAlunos();

  for (let i = 0; i < alunos.length; i++) {
    const aluno = alunos[i];

    if (aluno.detalhes) {
      let status = "Pendente";
      let entrada = "—";

      if (registros[aluno.id] !== undefined) {
        status = registros[aluno.id].status;

        if (registros[aluno.id].entrada !== "") {
          entrada = registros[aluno.id].entrada;
        }
      }

      resultado.push({
        id: aluno.id,
        nome: aluno.nome,
        turma: aluno.turma,
        data: textoHoje,
        entrada,
        status,
      });
    }
  }

  return resultado;
}
