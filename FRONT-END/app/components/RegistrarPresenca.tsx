
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import {
  registrarPresencaManualAPI,
  type AlunoAPI,
  type PresencaAPI,
} from "~/utils/registroHoje";
import { formatarDataCurta } from "~/utils/formatacao";
import { textoDaData } from "~/utils/filtros";

const STATUS = ["Presente", "Atrasado", "Justificado", "Ausente"];

function converterStatus(status: string) {
  const mapa: Record<string, string> = {
    PRESENTE: "Presente",
    ATRASADO: "Atrasado",
    JUSTIFICADO: "Justificado",
    AUSENTE: "Ausente",
  };

  return mapa[status] ?? status;
}

function horaAgora() {
  const agora = new Date();
  const hora = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");

  return hora + ":" + minuto;
}

export function RegistrarPresenca({
  aoFechar,
  aoSalvar,
  podeCorrigir,
  alunosAPI,
  presencasAPI,
}: {
  aoFechar: () => void;
  aoSalvar: (quantidade: number) => void;
  podeCorrigir: boolean;
  alunosAPI: AlunoAPI[];
  presencasAPI: PresencaAPI[];
}) {
  const hoje = textoDaData(new Date());

  const alunos = alunosAPI.map((aluno) => {
    const registros = presencasAPI
      .filter(
        (registro) =>
          registro.alunoId === aluno.id && registro.data === hoje
      )
      .sort((a, b) =>
        (b.horario ?? "").localeCompare(a.horario ?? "")
      );

    const ultimo = registros[0];

    const horario = ultimo?.horario ?? "";

    return {
      id: aluno.id,
      nome: aluno.nome,
      turma: aluno.turmaNome,
      statusHoje: ultimo
        ? converterStatus(ultimo.status)
        : "Pendente",
      entradaHoje: horario ? horario.slice(0, 5) : "",
      origemHoje: ultimo?.origem ?? null,
    };
  });

  const [turma, setTurma] = useState("Todas as turmas");
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [rascunho, setRascunho] = useState(() => {
    const inicial: Record<
      number,
      { status: string; entrada: string }
    > = {};

    for (let i = 0; i < alunos.length; i++) {
      if (alunos[i].statusHoje !== "Pendente") {
        inicial[alunos[i].id] = {
          status: alunos[i].statusHoje,
          entrada: alunos[i].entradaHoje,
        };
      }
    }

    return inicial;
  });

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !salvando) {
        aoFechar();
      }
    }

    window.addEventListener("keydown", aoTeclar);

    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar, salvando]);

  const visiveis = alunos.filter((aluno) => {
    const passaTurma =
      turma === "Todas as turmas" || aluno.turma === turma;

    const passaBusca = aluno.nome
      .toLowerCase()
      .includes(busca.trim().toLowerCase());

    return passaTurma && passaBusca;
  });

  function escolherStatus(aluno: any, status: string) {
    const novo = { ...rascunho };
    let entrada = "";

    if (status === "Presente" || status === "Atrasado") {
      entrada = horaAgora();

      if (
        rascunho[aluno.id] !== undefined &&
        rascunho[aluno.id].entrada !== ""
      ) {
        entrada = rascunho[aluno.id].entrada;
      }
    }

    novo[aluno.id] = { status, entrada };
    setRascunho(novo);
    setErro("");
  }

  function mudarHora(aluno: any, hora: string) {
    const novo = { ...rascunho };

    novo[aluno.id] = {
      status: rascunho[aluno.id].status,
      entrada: hora,
    };

    setRascunho(novo);
    setErro("");
  }

  function marcarPendentesComoPresentes() {
    const novo = { ...rascunho };

    for (let i = 0; i < visiveis.length; i++) {
      const aluno = visiveis[i];

      if (
        novo[aluno.id] === undefined &&
        aluno.origemHoje !== "RFID"
      ) {
        novo[aluno.id] = {
          status: "Presente",
          entrada: horaAgora(),
        };
      }
    }

    setRascunho(novo);
    setErro("");
  }

  async function salvar() {
    const alterados: {
      alunoId: number;
      status: string;
      entrada: string;
    }[] = [];

    for (let i = 0; i < alunos.length; i++) {
      const aluno = alunos[i];
      const item = rascunho[aluno.id];

      if (aluno.origemHoje === "RFID") {
        continue;
      }

      if (item !== undefined) {
        const mudouStatus = item.status !== aluno.statusHoje;
        const mudouHora = item.entrada !== aluno.entradaHoje;

        if (mudouStatus || mudouHora) {
          if (
            (item.status === "Presente" ||
              item.status === "Atrasado") &&
            item.entrada === ""
          ) {
            setErro(
              "Informe o horário de entrada de " + aluno.nome + "."
            );
            return;
          }

          alterados.push({
            alunoId: aluno.id,
            status: item.status,
            entrada: item.entrada,
          });
        }
      }
    }

    if (alterados.length === 0) {
      setErro("Nenhuma alteração para salvar.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      await Promise.all(
        alterados.map((item) =>
          registrarPresencaManualAPI(
            item.alunoId,
            item.status,
            item.entrada
          )
        )
      );

      aoSalvar(alterados.length);
    } catch (erro) {
      console.error("Erro ao registrar presenças:", erro);
      setErro(
        "Não foi possível salvar todas as presenças no servidor. Verifique a conexão e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  let pendentesVisiveis = 0;

  for (let i = 0; i < visiveis.length; i++) {
    if (
      rascunho[visiveis[i].id] === undefined &&
      visiveis[i].origemHoje !== "RFID"
    ) {
      pendentesVisiveis++;
    }
  }

  function classeBotao(status: string, selecionado: boolean) {
    if (!selecionado) {
      return "border border-black/10 text-[#526a65] hover:bg-black/5 dark:border-white/10 dark:text-[#b9d2cc] dark:hover:bg-white/10";
    }

    if (status === "Presente") {
      return "border border-transparent bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    }

    if (status === "Atrasado") {
      return "border border-transparent bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    }

    if (status === "Justificado") {
      return "border border-transparent bg-gray-500/20 text-gray-600 dark:text-gray-300";
    }

    return "border border-transparent bg-red-500/20 text-red-600 dark:text-red-400";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-registrar"
      onClick={() => !salvando && aoFechar()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151515]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              id="titulo-modal-registrar"
              className="text-lg font-semibold text-[#17332e] dark:text-white"
            >
              Registrar presença
            </h2>

            <p className="mt-1 text-sm text-[#6f8781] dark:text-[#8fa9a3]">
              Chamada de hoje, {formatarDataCurta(hoje)}
            </p>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            disabled={salvando}
            aria-label="Fechar"
            className="rounded-lg p-2 text-[#6f8781] transition hover:bg-black/5 hover:text-[#17332e] disabled:opacity-40 dark:text-[#8fa9a3] dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="app-report-filters !m-0 !p-0">
            <div>
              <label>Turma</label>
              <select
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
              >
                <option>Todas as turmas</option>
                <option>7º Ano A</option>
                <option>7º Ano B</option>
                <option>8º Ano A</option>
                <option>8º Ano B</option>
                <option>9º Ano A</option>
                <option>9º Ano B</option>
              </select>
            </div>

            <div className="app-report-search">
              <label>Pesquisar</label>
              <div>
                <Search size={17} />
                <input
                  placeholder="Pesquisar aluno..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={marcarPendentesComoPresentes}
            disabled={pendentesVisiveis === 0 || salvando}
            className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-[#526a65] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-[#b9d2cc] dark:hover:bg-white/10"
          >
            Marcar pendentes como presentes ({pendentesVisiveis})
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {visiveis.length === 0 && (
            <p className="py-8 text-center text-sm text-[#6f8781] dark:text-[#8fa9a3]">
              Nenhum aluno encontrado.
            </p>
          )}

          {visiveis.map((aluno) => {
            const item = rascunho[aluno.id];
            const jaMarcado = aluno.statusHoje !== "Pendente";

            const registroRFID = aluno.origemHoje === "RFID";

            const travado =
              registroRFID || (jaMarcado && !podeCorrigir);

            const comHora =
              item !== undefined &&
              (item.status === "Presente" ||
                item.status === "Atrasado");

            return (
              <div
                key={aluno.id}
                className="flex flex-wrap items-center gap-3 border-b border-slate-200 py-3 dark:border-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#17332e] dark:text-white">
                    {aluno.nome}
                  </p>
                  <p className="text-xs text-[#6f8781] dark:text-[#8fa9a3]">
                    {aluno.turma}
                    {item === undefined ? " · pendente" : ""}
                    {registroRFID ? " · Registrado por RFID" : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {STATUS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={travado || salvando}
                      title={
                        registroRFID
                          ? "Registros feitos por RFID não podem ser alterados manualmente"
                          : travado
                            ? "Sem permissão para corrigir presenças já registradas"
                            : ""
                      }
                      aria-pressed={
                        item !== undefined && item.status === status
                      }
                      onClick={() => escolherStatus(aluno, status)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${classeBotao(
                        status,
                        item !== undefined && item.status === status
                      )}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <input
                  type="time"
                  value={comHora ? item.entrada : ""}
                  disabled={!comHora || travado || salvando}
                  onChange={(e) => mudarHora(aluno, e.target.value)}
                  aria-label={"Horário de entrada de " + aluno.nome}
                  className="w-28 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-[#0d7f70] disabled:opacity-40 dark:border-white/15 dark:bg-[#1c1c1c] dark:text-white"
                />
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-[#6f8781] dark:text-[#8fa9a3]">
          Registros feitos por RFID não podem ser alterados manualmente. Correções de registros manuais atualizam o lançamento existente.
        </p>

        {erro && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
          >
            {erro}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={aoFechar}
            disabled={salvando}
            className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-[#526a65] transition hover:bg-black/5 disabled:opacity-40 dark:border-white/10 dark:text-[#b9d2cc] dark:hover:bg-white/10"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="rounded-xl bg-[#0d7f70] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#09695e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar presenças"}
          </button>
        </div>
      </div>
    </div>
  );
}
