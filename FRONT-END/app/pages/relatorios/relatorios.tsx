
import {
  Users,
  Download,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Search,
} from "lucide-react";
import { Notificacoes } from "~/components/Notificacoes";
import { DetalhesAluno } from "~/components/DetalhesAluno";
import { GerarRelatorio } from "~/components/GerarRelatorio";
import { Sidebar } from "~/components/Sidebar";
import { useEffect, useState } from "react";
import { filtrarAlunos, textoDaData } from "~/utils/filtros";
import { useUsuario } from "~/hooks/useUsuario";
import { Paginacao } from "~/components/Paginacao";
import { usePaginacao } from "~/hooks/usePaginacao";
import {
  buscarAlunos,
  buscarTurmas,
  buscarPresencas,
} from "~/services/api";
import { alunoDoBack } from "~/utils/conversaoBack";
import {
  filtrarPorPeriodo,
  contarPresencas,
  evolucaoPorDia,
} from "~/utils/relatorios";
import {
  dataISO,
  identificadorAluno,
  statusDaPresenca,
  registrosUnicosPorDia,
  calcularMediaAnual,
  calcularFaltasConsecutivas,
  calcularSituacao,
} from "~/utils/indicadoresFrequencia";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Lohran from "../../../public/lohran-avatar.png";

function converterPresencaDoBack(registro: any) {
  return {
    ...registro,
    data: dataISO(registro.data),
    nome: registro.alunoNome || registro.nome || "Aluno não identificado",
    turma: registro.turmaNome || registro.turma || "Sem turma",
    status: statusDaPresenca(registro.status),
    entrada: registro.horario || "—",
  };
}

export function Relatorios() {
  const { usuario, pode } = useUsuario();

  const [alunoAberto, setAlunoAberto] = useState<any>(null);
  const [relatorioAberto, setRelatorioAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [busca, setBusca] = useState("");
  const [turma, setTurma] = useState("Todas as turmas");
  const [periodo, setPeriodo] = useState("Últimos 30 dias");
  const [tipo, setTipo] = useState("Todos os tipos");

  const [todos, setTodos] = useState<any[]>([]);
  const [registrosDoBack, setRegistrosDoBack] = useState<any[]>([]);
  const [turmasDoBack, setTurmasDoBack] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroBack, setErroBack] = useState("");

  function carregarDados() {
    setCarregando(true);
    setErroBack("");

    Promise.all([buscarAlunos(), buscarPresencas()])
      .then(([dadosAlunos, dadosPresencas]) => {
        const hoje = textoDaData(new Date()).slice(0, 10);
        const anoAtual = Number(hoje.slice(0, 4));

        const registrosUnicos = registrosUnicosPorDia(dadosPresencas);

        const novaLista = [];

        for (let i = 0; i < dadosAlunos.length; i++) {
          const aluno = alunoDoBack(dadosAlunos[i]);

          const registrosDoAluno = registrosUnicos.filter(
            (registro) =>
              identificadorAluno(registro) === String(aluno.id),
          );

          const registrosDoAno = registrosDoAluno.filter(
            (registro) =>
              dataISO(registro.data).startsWith(String(anoAtual)) &&
              statusDaPresenca(registro.status) !== "Pendente",
          );

          const mediaAnual = calcularMediaAnual(
            registrosUnicos,
            aluno.id,
            anoAtual,
          );

          const faltasConsecutivas = calcularFaltasConsecutivas(
            registrosUnicos,
            aluno.id,
            new Date(),
          );

          const situacao = calcularSituacao(faltasConsecutivas);

          const registroDeHoje = registrosDoAluno.find(
            (registro) => dataISO(registro.data) === hoje,
          );

          const presenca = registroDeHoje
            ? statusDaPresenca(registroDeHoje.status)
            : "Pendente";

          novaLista.push({
            ...aluno,
            presenca,
            media:
              registrosDoAno.length === 0
                ? "—"
                : `${mediaAnual.toFixed(1).replace(".", ",")}%`,
            situacao,
            faltasConsecutivas,
          });
        }

        const novasPresencas = dadosPresencas.map(
          (registro: any) => converterPresencaDoBack(registro),
        );

        setTodos(novaLista);
        setRegistrosDoBack(novasPresencas);
      })
      .catch(() => {
        setErroBack(
          "Não foi possível carregar os dados dos relatórios. Verifique se o back está rodando.",
        );
      })
      .finally(() => {
        setCarregando(false);
      });

    buscarTurmas()
      .then((dados) => setTurmasDoBack(dados))
      .catch(() => setTurmasDoBack([]));
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const alunosDaTurma = filtrarAlunos(
    todos,
    "",
    turma,
    "Todos",
    "Todos",
  );

  const alunos = filtrarAlunos(
    todos,
    busca,
    turma,
    "Todos",
    "Todos",
  );

  const paginacao = usePaginacao(alunos);

  const registros = filtrarPorPeriodo(
    registrosDoBack,
    periodo,
    turma,
  );

  const contagem = contarPresencas(registros);
  const evolucao = evolucaoPorDia(registros);

  let emAtencao = 0;
  let emRisco = 0;

  for (let i = 0; i < alunosDaTurma.length; i++) {
    if (alunosDaTurma[i].situacao === "Em atenção") {
      emAtencao++;
    }

    if (alunosDaTurma[i].situacao === "Risco") {
      emRisco++;
    }
  }

  function aoGerar(nome: string, quantidade: number) {
    setRelatorioAberto(false);

    setAviso(
      "Relatório " +
        nome +
        " gerado com " +
        quantidade +
        (quantidade === 1 ? " linha." : " linhas."),
    );

    setTimeout(() => setAviso(""), 6000);
  }

  const mostrarGrafico =
    tipo === "Todos os tipos" || tipo === "Frequência";

  const mostrarFrequencia = mostrarGrafico;

  let classeGrafico = "app-card p-5 lg:col-span-2";

  if (mostrarGrafico === false) {
    classeGrafico = "app-card p-5 lg:col-span-3";
  }

  let fundoRosca = "#94a3b8";

  if (contagem.marcados > 0) {
    const pPresentes =
      (contagem.presentes / contagem.marcados) * 100;

    const pAusentes =
      pPresentes +
      (contagem.ausentes / contagem.marcados) * 100;

    const pAtrasados =
      pAusentes +
      (contagem.atrasados / contagem.marcados) * 100;

    fundoRosca = `conic-gradient(#22c7a9 0 ${pPresentes}%, #ef4444 ${pPresentes}% ${pAusentes}%, #f59e0b ${pAusentes}% ${pAtrasados}%, #60a5fa ${pAtrasados}% 100%)`;
  }

  function mudarFiltro(funcaoDoFiltro: any, valor: string) {
    funcaoDoFiltro(valor);
    paginacao.irPara(0);
  }

  return (
    <main className="app-shell">
      <Sidebar ativo="/relatorios" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="app-header">
          <div>
            <h1 className="app-title">Relatorios</h1>

            <p className="app-muted">
              Acompanhe o desempenho, a frequenia e outros indicadores da sua escola
            </p>
          </div>

          <div className="app-header-actions">
            <button
              type="button"
              onClick={() => setRelatorioAberto(true)}
              className="app-button-relatorio"
            >
              <Download size={18} />
              Gerar relatório
            </button>

            <Notificacoes className="text-gray-700 dark:text-[#b9d2cc]" />

            <div className="app-avatar">
              <img
                src={Lohran}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            </div>

            <span className="text-lg font-semibold text-gray-900 dark:text-[#f5fffc]">
              {usuario?.nome ?? ""}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="app-page-grid">
            {aviso && (
              <div
                role="status"
                className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300"
              >
                {aviso}
              </div>
            )}

            {erroBack !== "" && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300"
              >
                {erroBack}
              </div>
            )}

            <div className="app-grid-relatorio">
              <div className="app-report-stat">
                <div className="app-report-icon blue">
                  <Users size={20} />
                </div>

                <div>
                  <p>Total de alunos</p>
                  <span>{todos.length}</span>
                </div>
              </div>

              <div className="app-report-stat">
                <div className="app-report-icon green">
                  <TrendingUp size={20} />
                </div>

                <div>
                  <p>Taxa de presença</p>
                  <span>{contagem.taxa}%</span>
                </div>
              </div>

              <div className="app-report-stat">
                <div className="app-report-icon yellow">
                  <AlertTriangle size={20} />
                </div>

                <div>
                  <p>Alunos em atenção</p>
                  <span>{emAtencao}</span>
                </div>
              </div>

              <div className="app-report-stat">
                <div className="app-report-icon red">
                  <BarChart3 size={20} />
                </div>

                <div>
                  <p>Alunos com risco</p>
                  <span>{emRisco}</span>
                </div>
              </div>
            </div>

            <div className="app-report-filters">
              <div>
                <label>Período</label>

                <select
                  value={periodo}
                  onChange={(e) =>
                    mudarFiltro(setPeriodo, e.target.value)
                  }
                >
                  <option>Últimos 30 dias</option>
                  <option>Últimos 7 dias</option>
                  <option>Este mês</option>
                  <option>Este ano</option>
                </select>
              </div>

              <div>
                <label>Turma</label>

                <select
                  value={turma}
                  onChange={(e) =>
                    mudarFiltro(setTurma, e.target.value)
                  }
                >
                  <option>Todas as turmas</option>

                  {turmasDoBack.map((t) => (
                    <option key={t.id} value={t.nome}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Disciplina</label>

                <select
                  disabled
                  title="A frequência ainda não tem dados por disciplina"
                >
                  <option>Todas as disciplinas</option>
                  <option>Matemática</option>
                  <option>Português</option>
                  <option>Ciências</option>
                </select>
              </div>

              <div>
                <label>Tipo de relatório</label>

                <select
                  value={tipo}
                  onChange={(e) =>
                    mudarFiltro(setTipo, e.target.value)
                  }
                >
                  <option>Todos os tipos</option>
                  <option>Frequência</option>
                  <option>Alunos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {mostrarGrafico && (
                <div className={classeGrafico}>
                  <h2 className="app-report-title">
                    Gráfico de frequência
                  </h2>

                  <div className="mt-4 h-60 w-full text-gray-500 dark:text-[#8fb1aa]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={evolucao}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="0"
                          vertical={true}
                          horizontal={false}
                          className="opacity-30"
                        />

                        <XAxis
                          dataKey="dia"
                          tick={{
                            fontSize: 12,
                            fill: "currentColor",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "currentColor",
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />

                        <Tooltip />

                        <Line
                          type="monotone"
                          dataKey="presentes"
                          name="Presentes"
                          stroke="#22c7a9"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />

                        <Line
                          type="monotone"
                          dataKey="faltosos"
                          name="Faltosos"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />

                        <Line
                          type="monotone"
                          dataKey="pendentes"
                          name="Pendentes"
                          stroke="#2f8de4"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {mostrarFrequencia && (
                <div className="app-card p-3">
                  <h2 className="app-report-title">
                    Frequência dos alunos
                  </h2>

                  <div className="mt-4 flex items-center justify-center">
                    <div
                      className="flex h-32 w-32 items-center justify-center rounded-full"
                      style={{ background: fundoRosca }}
                    >
                      <div className="flex h-22 w-22 flex-col items-center justify-center rounded-full bg-white dark:bg-[#0a141a]">
                        <strong className="text-2xl text-gray-900 dark:text-white">
                          {contagem.marcados > 0
                            ? contagem.taxa + "%"
                            : "—"}
                        </strong>

                        <span className="text-xs text-gray-500 dark:text-[#8fb1aa]">
                          Presença
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-500">
                        Presentes
                      </span>
                      <strong>{contagem.presentes}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-red-500">Ausentes</span>
                      <strong>{contagem.ausentes}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-yellow-500">
                        Atrasados
                      </span>
                      <strong>{contagem.atrasados}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-blue-500">
                        Justificados
                      </span>
                      <strong>{contagem.justificados}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="app-report-search">
              <label>Pesquisar</label>

              <div>
                <Search size={17} />

                <input
                  placeholder="Pesquisar aluno..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    paginacao.irPara(0);
                  }}
                />
              </div>
            </div>

            <div className="app-card overflow-hidden">
              <div className="border-b border-slate-200 p-5 dark:border-white/10">
                <h2 className="app-report-title">
                  Relatório de alunos
                </h2>
              </div>

              <div className="overflow-x-auto p-4">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-left dark:border-white/10">
                      <th className="py-3 p-2">#</th>
                      <th>Aluno</th>
                      <th>Turma</th>
                      <th>Presença</th>
                      <th>Média</th>
                      <th>Situação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {carregando && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center app-muted"
                        >
                          Carregando relatórios...
                        </td>
                      </tr>
                    )}

                    {!carregando &&
                      alunos.length === 0 &&
                      erroBack === "" && (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center app-muted"
                          >
                            Nenhum aluno encontrado com esses filtros.
                          </td>
                        </tr>
                      )}

                    {!carregando &&
                      paginacao.bloco.map((aluno) => (
                        <tr
                          key={aluno.id}
                          className="border-b border-slate-200 dark:border-white/5"
                        >
                          <td className="py-3 p-2">{aluno.id}</td>
                          <td>{aluno.nome}</td>
                          <td>{aluno.turma}</td>
                          <td>{aluno.presenca}</td>
                          <td>{aluno.media}</td>

                          <td>
                            <span
                              className={
                                aluno.situacao === "Bom"
                                  ? "app-status-green"
                                  : aluno.situacao === "Em atenção"
                                    ? "app-status-yellow"
                                    : "app-status-red"
                              }
                            >
                              {aluno.situacao}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              aria-label={"Ver detalhes de " + aluno.nome}
                              title="Ver detalhes"
                              onClick={() => setAlunoAberto(aluno)}
                              className="cursor-pointer px-2"
                            >
                              •••
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 pb-4">
                <Paginacao
                  paginaAtual={paginacao.paginaAtual}
                  totalPaginas={paginacao.totalPaginas}
                  totalItens={paginacao.totalItens}
                  tamanho={paginacao.tamanho}
                  irPara={paginacao.irPara}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {alunoAberto && (
        <DetalhesAluno
          aluno={alunoAberto}
          aoFechar={() => setAlunoAberto(null)}
          podeEditar={pode("alunos.editar")}
          podeExcluir={pode("alunos.excluir")}
        />
      )}

      {relatorioAberto && (
        <GerarRelatorio
          aoFechar={() => setRelatorioAberto(false)}
          aoGerar={aoGerar}
          tipo={tipo}
          periodo={periodo}
          turma={turma}
          registros={registros}
          alunos={alunos}
        />
      )}
    </main>
  );
}
