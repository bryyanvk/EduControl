
import {
  TrendingUp,
  Search,
  Plus,
  AlertTriangle,
  UserRound,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesCombined,
  Filter,
} from "lucide-react";
import { Notificacoes } from "~/components/Notificacoes";
import { NovoAluno } from "~/components/NovoAluno";
import { DetalhesAluno } from "~/components/DetalhesAluno";
import { Sidebar } from "~/components/Sidebar";
import { Paginacao } from "~/components/Paginacao";
import { usePaginacao } from "~/hooks/usePaginacao";
import {
  buscarAlunos,
  buscarTurmas,
  buscarPresencas,
} from "~/services/api";
import { alunoDoBack } from "~/utils/conversaoBack";
import {
  calcularMediaAnual,
  calcularFaltasConsecutivas,
  calcularSituacao,
  registrosUnicosPorDia,
  identificadorAluno,
  statusDaPresenca,
} from "~/utils/indicadoresFrequencia";
import { useEffect, useState } from "react";
import { filtrarAlunos, textoDaData } from "~/utils/filtros";
import { useUsuario } from "~/hooks/useUsuario";
import { fotoOuPadrao } from "~/utils/fotoPerfil";

export function Alunos() {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const { pode, usuario } = useUsuario();

  const [alunoAberto, setAlunoAberto] = useState<any>(null);
  const [lista, setLista] = useState<any[]>([]);
  const [turmasDoBack, setTurmasDoBack] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroBack, setErroBack] = useState("");
  const [erroPresencas, setErroPresencas] = useState("");

  function carregar() {
    setCarregando(true);
    setErroBack("");
    setErroPresencas("");

    Promise.all([buscarAlunos(), buscarPresencas()])
      .then(([dadosAlunos, dadosPresencas]) => {
        const hoje = textoDaData(new Date()).slice(0, 10);
        const anoAtual = hoje.slice(0, 4);

        const registrosUnicos = registrosUnicosPorDia(dadosPresencas);

        const novaLista = dadosAlunos.map((alunoBack: any) => {
          const aluno = alunoDoBack(alunoBack);

          const registrosDoAluno = registrosUnicos.filter(
            (registro) =>
              identificadorAluno(registro) === String(aluno.id)
          );

          const registrosDoAno = registrosDoAluno.filter(
            (registro) =>
              registro.data.startsWith(anoAtual) &&
              registro.status !== "PENDENTE" &&
              registro.status !== "JUSTIFICADO"
          );

          const mediaAnual =
            registrosDoAno.length > 0
              ? calcularMediaAnual(
                  registrosUnicos,
                  aluno.id,
                  Number(anoAtual)
                )
              : null;

          const faltasConsecutivas = calcularFaltasConsecutivas(
            registrosUnicos,
            aluno.id,
            new Date()
          );

          const registroDeHoje = registrosDoAluno.find(
            (registro) => registro.data === hoje
          );

          return {
            ...aluno,
            presenca: registroDeHoje
              ? statusDaPresenca(registroDeHoje.status)
              : "Pendente",
            media:
              mediaAnual === null
                ? "—"
                : `${mediaAnual.toFixed(1).replace(".", ",")}%`,
            situacao: calcularSituacao(faltasConsecutivas),
            faltasConsecutivas,
          };
        });

        setLista(novaLista);
      })
      .catch(() => {
        setErroBack(
          "Não foi possível carregar os alunos e as presenças. Verifique se o back está rodando."
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
    carregar();
  }, []);

  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [busca, setBusca] = useState("");
  const [turma, setTurma] = useState("Todas as turmas");
  const [status, setStatus] = useState("Todos");
  const [ordem, setOrdem] = useState("Todos");

  const todos = lista;
  const alunos = filtrarAlunos(todos, busca, turma, status, ordem);
  const paginacao = usePaginacao(alunos);

  let emAtencao = 0;
  let emRisco = 0;
  let novasMatriculas = 0;

  const mesAtual = textoDaData(new Date()).slice(0, 7);

  for (let i = 0; i < todos.length; i++) {
    if (todos[i].situacao === "Em atenção") {
      emAtencao++;
    }

    if (todos[i].situacao === "Risco") {
      emRisco++;
    }

    if (
      todos[i].detalhes?.dataMatricula &&
      todos[i].detalhes.dataMatricula.slice(0, 7) === mesAtual
    ) {
      novasMatriculas++;
    }
  }

  function aoCadastrar(aluno: any) {
    carregar();
    setCadastroAberto(false);
    setBusca("");
    setTurma("Todas as turmas");
    setStatus("Todos");
    paginacao.irPara(0);
    setAviso(aluno.nome + " foi cadastrado.");
    setTimeout(() => setAviso(""), 6000);
  }

  function finalizarAlteracaoAluno(mensagem: string) {
    setAlunoAberto(null);
    carregar();
    setAviso(mensagem);
    setTimeout(() => setAviso(""), 6000);
  }

  return (
    <main className="app-shell block-s">
      <Sidebar ativo="/alunos" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="app-header">
          <div>
            <h1 className="text-2xl font-bold">Alunos</h1>
            <p className="app-muted">
              Gerencie os alunos da sua instituição
            </p>
          </div>

          <div className="app-header-actions">
            {pode("alunos.cadastrar") && (
              <button
                type="button"
                onClick={() => setCadastroAberto(true)}
                className="app-button-relatorio"
              >
                <Plus size={18} />
                Novo aluno
              </button>
            )}

            <Notificacoes />

            <div className="app-avatar">
              <img
                src={fotoOuPadrao(usuario?.fotoPerfil, usuario?.nome)}
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
          <div className="app-grid-relatorio p-5">
            <div className="app-report-stat relative">
              <div className="app-report-icon blue">
                <UserRound size={20} />
              </div>

              <div>
                <div>
                  <p>Total de alunos</p>
                  <span>{todos.length}</span>
                </div>

                <ChartNoAxesCombined
                  size={20}
                  className="absolute bottom-5 right-5 text-blue-300"
                />
              </div>
            </div>

            <div className="app-report-stat relative">
              <div className="app-report-icon green">
                <TrendingUp size={20} />
              </div>

              <div>
                <div>
                  <p>Ativos</p>
                  <span>{todos.length}</span>
                </div>

                <ChartNoAxesCombined
                  size={20}
                  className="absolute bottom-5 right-5 text-green-300"
                />
              </div>
            </div>

            <div className="app-report-stat relative">
              <div className="app-report-icon yellow">
                <AlertTriangle size={20} />
              </div>

              <div className="flex justify-around">
                <div>
                  <p>Alunos em atenção</p>
                  <span>{emAtencao}</span>
                </div>

                <ChartNoAxesCombined
                  size={20}
                  className="absolute bottom-5 right-5 text-yellow-300"
                />
              </div>
            </div>

            <div className="app-report-stat relative">
              <div className="app-report-icon purple">
                <ChartNoAxesColumnIncreasing size={20} />
              </div>

              <div>
                <div>
                  <p>Novas matrículas</p>
                  <span>{novasMatriculas}</span>
                </div>

                <ChartNoAxesCombined
                  size={20}
                  className="absolute bottom-5 right-5 text-purple-300"
                />
              </div>
            </div>
          </div>

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
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
                {erroBack}
              </div>
            )}

            {erroPresencas !== "" && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-300">
                {erroPresencas}
              </div>
            )}

            <div className="app-report-filters">
              <div className="app-report-search col-span-3">
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

              <div className="flex items-end">
                <button
                  type="button"
                  className="app-button-filtrar"
                  aria-expanded={filtrosAbertos}
                  onClick={() => setFiltrosAbertos(!filtrosAbertos)}
                >
                  <Filter size={16} />
                  Filtrar
                </button>
              </div>

              {filtrosAbertos && (
                <>
                  <div>
                    <label>Turma</label>

                    <select
                      value={turma}
                      onChange={(e) => {
                        setTurma(e.target.value);
                        paginacao.irPara(0);
                      }}
                    >
                      <option>Todas as turmas</option>
                      <option>Sem turma</option>

                      {turmasDoBack.map((t) => (
                        <option key={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Status</label>

                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        paginacao.irPara(0);
                      }}
                    >
                      <option>Todos</option>
                      <option>Bom</option>
                      <option>Em atenção</option>
                      <option>Risco</option>
                    </select>
                  </div>

                  <div>
                    <label>Ordenar</label>

                    <select
                      value={ordem}
                      onChange={(e) => {
                        setOrdem(e.target.value);
                        paginacao.irPara(0);
                      }}
                    >
                      <option>Todos</option>
                      <option>Ordem alfabética</option>
                      <option>Média crescente</option>
                      <option>Média decrescente</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="app-card min-h-60 p-4">
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
                      <td colSpan={7} className="py-8 text-center app-muted">
                        Carregando alunos...
                      </td>
                    </tr>
                  )}

                  {alunos.length === 0 &&
                    carregando === false &&
                    erroBack === "" && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center app-muted">
                          Nenhum aluno encontrado com esses filtros.
                        </td>
                      </tr>
                    )}

                  {paginacao.bloco.map((aluno) => (
                    <tr
                      key={aluno.id}
                      className="border-b border-slate-200 hover:bg-gray-100 dark:border-white/5 dark:hover:bg-[#101f27]"
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

      {alunoAberto && (
        <DetalhesAluno
          aluno={alunoAberto}
          aoFechar={() => setAlunoAberto(null)}
          podeEditar={pode("alunos.editar")}
          podeExcluir={pode("alunos.excluir")}
          turmas={turmasDoBack}
          aoAtualizar={finalizarAlteracaoAluno}
          aoExcluir={finalizarAlteracaoAluno}
        />
      )}

      {cadastroAberto && (
        <NovoAluno
          aoFechar={() => setCadastroAberto(false)}
          aoSalvar={aoCadastrar}
          alunosExistentes={lista}
          turmas={turmasDoBack}
        />
      )}
    </main>
  );
}
