
import { textoDaData } from "~/utils/filtros";

function dataISO(data: any) {
  if (!data) return "";

  if (Array.isArray(data)) {
    const ano = String(data[0]).padStart(4, "0");
    const mes = String(data[1]).padStart(2, "0");
    const dia = String(data[2]).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  return String(data).slice(0, 10);
}

function normalizarStatus(status: any) {
  const valor = String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  if (valor === "PRESENTE") return "Presente";
  if (valor === "ATRASADO") return "Atrasado";
  if (valor === "JUSTIFICADO") return "Justificado";
  if (valor === "FALTA" || valor === "FALTOU" || valor === "AUSENTE") {
    return "Ausente";
  }
  if (valor === "PENDENTE") return "Pendente";

  return "Desconhecido";
}

function registrosUnicosPorDia(registros: any[]) {
  const mapa = new Map<string, any>();

  for (let i = 0; i < registros.length; i++) {
    const registro = registros[i];
    const data = dataISO(registro.data);

    if (!data) continue;

    const identificador =
      registro.alunoId ??
      registro.nome ??
      registro.alunoNome ??
      registro.id;

    const chave = `${identificador}-${data}`;
    const anterior = mapa.get(chave);

    if (
      !anterior ||
      String(registro.horario || "") >= String(anterior.horario || "")
    ) {
      mapa.set(chave, {
        ...registro,
        data,
        status: normalizarStatus(registro.status),
        turma: registro.turmaNome || registro.turma || "Sem turma",
      });
    }
  }

  return Array.from(mapa.values());
}

export function filtrarPorPeriodo(
  registros: any[],
  periodo: string,
  turma: string,
) {
  const hoje = textoDaData(new Date()).slice(0, 10);

  let inicio = "";

  if (periodo === "Últimos 7 dias") {
    const data = new Date();
    data.setDate(data.getDate() - 6);
    inicio = textoDaData(data);
  }

  if (periodo === "Últimos 30 dias") {
    const data = new Date();
    data.setDate(data.getDate() - 29);
    inicio = textoDaData(data);
  }

  if (periodo === "Este mês") {
    inicio = hoje.slice(0, 7) + "-01";
  }

  if (periodo === "Este ano") {
    inicio = hoje.slice(0, 4) + "-01-01";
  }

  const unicos = registrosUnicosPorDia(registros);
  const resultado = [];

  for (let i = 0; i < unicos.length; i++) {
    const registro = unicos[i];

    const dentroDoPeriodo =
      registro.data >= inicio && registro.data <= hoje;

    const dentroDaTurma =
      turma === "Todas as turmas" || registro.turma === turma;

    if (dentroDoPeriodo && dentroDaTurma) {
      resultado.push(registro);
    }
  }

  return resultado.sort((a, b) => a.data.localeCompare(b.data));
}

export function contarPresencas(registros: any[]) {
  let presentes = 0;
  let atrasados = 0;
  let justificados = 0;
  let ausentes = 0;

  for (let i = 0; i < registros.length; i++) {
    const status = normalizarStatus(registros[i].status);

    if (status === "Presente") presentes++;
    if (status === "Atrasado") atrasados++;
    if (status === "Justificado") justificados++;
    if (status === "Ausente") ausentes++;
  }

  const marcados = presentes + atrasados + justificados + ausentes;

  let taxa = 0;

  if (marcados > 0) {
    taxa = Math.round(((presentes + atrasados) / marcados) * 100);
  }

  return {
    presentes,
    atrasados,
    justificados,
    ausentes,
    marcados,
    taxa,
  };
}

export function evolucaoPorDia(registros: any[]) {
  const dias: any = {};

  for (let i = 0; i < registros.length; i++) {
    const registro = registros[i];
    const data = dataISO(registro.data);
    const status = normalizarStatus(registro.status);

    if (!data) continue;

    if (dias[data] === undefined) {
      dias[data] = {
        presentes: 0,
        faltosos: 0,
        pendentes: 0,
      };
    }

    if (status === "Presente" || status === "Atrasado") {
      dias[data].presentes++;
    }

    if (status === "Ausente" || status === "Justificado") {
      dias[data].faltosos++;
    }

    if (status === "Pendente") {
      dias[data].pendentes++;
    }
  }

  const datas = Object.keys(dias).sort();
  const resultado = [];

  for (let i = 0; i < datas.length; i++) {
    const data = datas[i];

    resultado.push({
      dia: data.slice(8, 10) + "/" + data.slice(5, 7),
      presentes: dias[data].presentes,
      faltosos: dias[data].faltosos,
      pendentes: dias[data].pendentes,
    });
  }

  return resultado;
}
