
export function normalizarStatus(status: any): string {
  return String(status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function identificadorAluno(registro: any): string {
  return String(
    registro.alunoId ??
    registro.aluno?.id ??
    registro.aluno?.alunoId ??
    registro.idAluno ??
    registro.nome ??
    registro.alunoNome ??
    registro.id ??
    ""
  );
}

export function dataISO(data: any): string {
  if (!data) return "";

  if (Array.isArray(data)) {
    const ano = String(data[0]).padStart(4, "0");
    const mes = String(data[1]).padStart(2, "0");
    const dia = String(data[2]).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  if (typeof data === "string") {
    const valor = data.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
      return valor.slice(0, 10);
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      const [dia, mes, ano] = valor.split("/");
      return `${ano}-${mes}-${dia}`;
    }
  }

  const convertida = new Date(data);

  if (Number.isNaN(convertida.getTime())) return "";

  const ano = convertida.getFullYear();
  const mes = String(convertida.getMonth() + 1).padStart(2, "0");
  const dia = String(convertida.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export function statusDaPresenca(status: any): string {
  const valor = normalizarStatus(status);

  if (valor === "PRESENTE") return "Presente";
  if (valor === "ATRASADO") return "Atrasado";
  if (valor === "JUSTIFICADO") return "Justificado";

  if (
    valor === "FALTA" ||
    valor === "FALTOU" ||
    valor === "AUSENTE"
  ) {
    return "Ausente";
  }

  if (valor === "PENDENTE") return "Pendente";

  return "Pendente";
}

export function registrosUnicosPorDia(registros: any[]): any[] {
  const mapa = new Map<string, any>();

  for (const registro of registros ?? []) {
    const data = dataISO(
      registro.data ??
      registro.dataPresenca ??
      registro.dataRegistro
    );

    const alunoId = identificadorAluno(registro);

    if (!data || !alunoId) continue;

    const chave = `${alunoId}-${data}`;
    const existente = mapa.get(chave);

    const horarioAtual = String(registro.horario ?? "");
    const horarioExistente = String(existente?.horario ?? "");

    if (!existente || horarioAtual >= horarioExistente) {
      mapa.set(chave, {
        ...registro,
        data,
        status: normalizarStatus(registro.status),
      });
    }
  }

  return Array.from(mapa.values());
}

export function calcularMediaAnual(
  registros: any[],
  alunoId: string | number,
  anoAtual = new Date().getFullYear()
): number {
  const registrosDoAluno = registrosUnicosPorDia(registros).filter(
    (registro) => {
      const status = normalizarStatus(registro.status);

      return (
        identificadorAluno(registro) === String(alunoId) &&
        Number(registro.data.slice(0, 4)) === anoAtual &&
        status !== "PENDENTE" &&
        status !== "JUSTIFICADO"
      );
    }
  );

  if (registrosDoAluno.length === 0) return 0;

  const presentes = registrosDoAluno.filter((registro) => {
    const status = normalizarStatus(registro.status);

    return status === "PRESENTE" || status === "ATRASADO";
  }).length;

  return Math.round((presentes / registrosDoAluno.length) * 100);
}

export function calcularFaltasConsecutivas(
  registros: any[],
  alunoId: string | number,
  dataReferencia = new Date()
): number {
  const dataLimite = dataISO(dataReferencia);

  const registrosDoAluno = registrosUnicosPorDia(registros)
    .filter((registro) => {
      return (
        identificadorAluno(registro) === String(alunoId) &&
        registro.data <= dataLimite
      );
    })
    .sort((a, b) => b.data.localeCompare(a.data));

  let faltasConsecutivas = 0;

  for (const registro of registrosDoAluno) {
    const status = normalizarStatus(registro.status);

    // Registros pendentes não alteram a sequência.
    if (status === "PENDENTE") continue;

    // Conta faltas.
    if (
      status === "FALTA" ||
      status === "FALTOU" ||
      status === "AUSENTE"
    ) {
      faltasConsecutivas++;
      continue;
    }

    // Presença, atraso ou justificativa interrompem a sequência.
    if (
      status === "PRESENTE" ||
      status === "ATRASADO" ||
      status === "JUSTIFICADO"
    ) {
      break;
    }
  }

  return faltasConsecutivas;
}

export function calcularSituacao(faltasConsecutivas: number): string {
  if (faltasConsecutivas >= 5) return "Risco";
  if (faltasConsecutivas >= 4) return "Em atenção";
  return "Bom";
}

export function calcularIndicadoresAluno(
  registros: any[],
  alunoId: string | number,
  dataReferencia = new Date()
) {
  const mediaAnual = calcularMediaAnual(
    registros,
    alunoId,
    dataReferencia.getFullYear()
  );

  const faltasConsecutivas = calcularFaltasConsecutivas(
    registros,
    alunoId,
    dataReferencia
  );

  return {
    mediaAnual,
    faltasConsecutivas,
    situacao: calcularSituacao(faltasConsecutivas),
  };
}
