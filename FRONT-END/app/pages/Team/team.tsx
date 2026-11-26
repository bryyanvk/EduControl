
import {
  Users,
  Plus,
  ShieldCheck,
  GraduationCap,
  BriefcaseBusiness,
  ClipboardList,
  UserCog,
  Search,
  Filter,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Notificacoes } from "~/components/Notificacoes";
import { DetalhesFuncionario } from "~/components/DetalhesFuncionario";
import { NovoFuncionario } from "~/components/NovoFuncionario";
import { Sidebar } from "~/components/Sidebar";
import { useUsuario } from "~/hooks/useUsuario";
import { buscarFuncionarios } from "~/services/api";
import { funcionarioDoBack } from "~/utils/conversaoBack";
import { fotoOuPadrao } from "~/utils/fotoPerfil";

function normalizar(valor: any) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function Team() {
  const { pode, usuario } = useUsuario();

  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [funcionarioAberto, setFuncionarioAberto] = useState<any>(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);

  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("Todos");
  const [filtroSetor, setFiltroSetor] = useState("Todos");
  const [filtroVinculo, setFiltroVinculo] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregarFuncionarios = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await buscarFuncionarios();

      if (!Array.isArray(resposta)) {
        throw new Error("O backend não retornou uma lista válida de funcionários.");
      }

      setFuncionarios(resposta.map(funcionarioDoBack));
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os funcionários."
      );
      setFuncionarios([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarFuncionarios();
  }, [carregarFuncionarios]);

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((funcionario) => {
      const termo = normalizar(pesquisa);

      const correspondePesquisa =
        !termo ||
        normalizar(funcionario.nome).includes(termo) ||
        normalizar(funcionario.cargo).includes(termo) ||
        normalizar(funcionario.email).includes(termo) ||
        normalizar(funcionario.matricula).includes(termo);

      const correspondeCargo =
        filtroCargo === "Todos" ||
        funcionario.cargo === filtroCargo;

      const correspondeSetor =
        filtroSetor === "Todos" ||
        funcionario.setor === filtroSetor;

      const correspondeVinculo =
        filtroVinculo === "Todos" ||
        funcionario.vinculo === filtroVinculo;

      const correspondeStatus =
        filtroStatus === "Todos" ||
        funcionario.status === filtroStatus;

      return (
        correspondePesquisa &&
        correspondeCargo &&
        correspondeSetor &&
        correspondeVinculo &&
        correspondeStatus
      );
    });
  }, [
    funcionarios,
    pesquisa,
    filtroCargo,
    filtroSetor,
    filtroVinculo,
    filtroStatus,
  ]);

  const contarCargo = (termo: string) =>
    funcionarios.filter((funcionario) =>
      normalizar(funcionario.cargo).includes(normalizar(termo))
    ).length;

  const totalEquipe = funcionarios.length;
  const professores = contarCargo("professor");
  const coordenadores = contarCargo("coordenador");
  const supervisores = funcionarios.filter(
    (funcionario) =>
      normalizar(funcionario.cargo).includes("supervisor") ||
      normalizar(funcionario.cargo).includes("supervisao")
  ).length;
  const secretarios = funcionarios.filter(
    (funcionario) =>
      normalizar(funcionario.cargo).includes("secretario")
  ).length;
  const administrativos = funcionarios.filter(
    (funcionario) =>
      normalizar(funcionario.setor).includes("administrativo") ||
      normalizar(funcionario.cargo).includes("administrador") ||
      normalizar(funcionario.cargo).includes("auxiliar administrativo")
  ).length;

  const cargos = [
    { nome: "Professores", quantidade: professores },
    { nome: "Coordenadores", quantidade: coordenadores },
    { nome: "Administrativo", quantidade: administrativos },
    { nome: "Supervisão", quantidade: supervisores },
  ];

  const larguraGrafico = (quantidade: number) => {
    if (totalEquipe === 0) return "0%";

    return `${Math.min((quantidade / totalEquipe) * 100, 100)}%`;
  };

  const opcoesCargo = Array.from(
    new Set(funcionarios.map((funcionario) => funcionario.cargo).filter(Boolean))
  );

  const opcoesSetor = Array.from(
    new Set(funcionarios.map((funcionario) => funcionario.setor).filter(Boolean))
  );

  const proximoId =
    funcionarios.reduce(
      (maior, funcionario) => Math.max(maior, Number(funcionario.id) || 0),
      0
    ) + 1;

  async function aoCadastrar(funcionario: any) {
    setCadastroAberto(false);
    setAviso(`${funcionario.nome} foi enviado para o backend.`);
    await carregarFuncionarios();
  }

  return (
    <main className="app-shell">
      <Sidebar ativo="/team" />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="app-header">
          <div>
            <h1 className="text-2xl font-bold">Team</h1>
            <p className="app-muted">
              Gerencie a equipe e acompanhe responsabilidades
            </p>
          </div>

          <div className="app-header-actions">
            {pode("usuarios.gerenciar") && (
              <button
                type="button"
                onClick={() => setCadastroAberto(true)}
                className="app-button-relatorio"
              >
                <Plus size={18} />
                Novo funcionário
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
          <div className="app-page-grid">
            {aviso && (
              <div
                role="status"
                className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300"
              >
                {aviso}
              </div>
            )}

            {erro && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500"
              >
                Erro ao carregar funcionários: {erro}
                <button
                  type="button"
                  onClick={carregarFuncionarios}
                  className="ml-3 underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            <div className="app-grid-team">
              <div className="app-report-stat">
                <div className="app-report-icon bg-cyan-500/15 text-cyan-500">
                  <Users size={20} />
                </div>
                <div>
                  <p>Total da equipe</p>
                  <span>{carregando ? "..." : totalEquipe}</span>
                </div>
              </div>

              <div className="app-report-stat">
                <div className="app-report-icon bg-emerald-500/15 text-emerald-500">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <p>Professores</p>
                  <span>{carregando ? "..." : professores}</span>
                </div>
              </div>

              <div className="app-report-stat">
                <div className="app-report-icon bg-indigo-500/15 text-indigo-500">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p>Coordenadores</p>
                  <span>{carregando ? "..." : coordenadores}</span>
                </div>
              </div>

              <div className="app-report-stat">
                <div className="app-report-icon bg-orange-500/15 text-orange-500">
                  <BriefcaseBusiness size={20} />
                </div>
                <div>
                  <p>Administrativo</p>
                  <span>{carregando ? "..." : administrativos}</span>
                </div>
              </div>

              <div className="app-report-stat">
                <div className="app-report-icon bg-rose-500/15 text-rose-500">
                  <UserCog size={20} />
                </div>
                <div>
                  <p>Supervisores</p>
                  <span>{carregando ? "..." : supervisores}</span>
                </div>
              </div>

              <div className="app-report-stat">
                <div className="app-report-icon bg-violet-500/15 text-violet-500">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <p>Secretários</p>
                  <span>{carregando ? "..." : secretarios}</span>
                </div>
              </div>
            </div>

            <div className="app-report-filters">
              <div className="app-report-search col-span-3">
                <label>Pesquisar</label>
                <div>
                  <Search size={17} />
                  <input
                    value={pesquisa}
                    onChange={(event) => setPesquisa(event.target.value)}
                    placeholder="Pesquisar funcionário..."
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
                    <label>Cargo</label>
                    <select
                      value={filtroCargo}
                      onChange={(event) => setFiltroCargo(event.target.value)}
                    >
                      <option value="Todos">Todos os cargos</option>
                      {opcoesCargo.map((cargo) => (
                        <option key={cargo} value={cargo}>
                          {cargo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Setor</label>
                    <select
                      value={filtroSetor}
                      onChange={(event) => setFiltroSetor(event.target.value)}
                    >
                      <option value="Todos">Todos os setores</option>
                      {opcoesSetor.map((setor) => (
                        <option key={setor} value={setor}>
                          {setor}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Vínculo</label>
                    <select
                      value={filtroVinculo}
                      onChange={(event) => setFiltroVinculo(event.target.value)}
                    >
                      <option value="Todos">Todos</option>
                      <option value="Efetivo">Efetivo</option>
                      <option value="Contratado">Contratado</option>
                    </select>
                  </div>

                  <div>
                    <label>Status</label>
                    <select
                      value={filtroStatus}
                      onChange={(event) => setFiltroStatus(event.target.value)}
                    >
                      <option value="Todos">Todos</option>
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                      <option value="Bloqueado">Bloqueado</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="app-card overflow-hidden p-4">
                <h2 className="app-report-title mb-4">
                  Funcionários cadastrados
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-left dark:border-white/10">
                        <th className="py-3 p-2">#</th>
                        <th>Nome</th>
                        <th>Cargo</th>
                        <th>Setor</th>
                        <th>Vínculo</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {carregando ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center app-muted">
                            Carregando funcionários...
                          </td>
                        </tr>
                      ) : funcionariosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center app-muted">
                            {funcionarios.length === 0
                              ? "Nenhum funcionário cadastrado no backend."
                              : "Nenhum funcionário encontrado com esses filtros."}
                          </td>
                        </tr>
                      ) : (
                        funcionariosFiltrados.map((funcionario) => (
                          <tr
                            key={funcionario.id}
                            className="border-b border-slate-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-[#101f27]"
                          >
                            <td className="py-3 p-2">{funcionario.id}</td>
                            <td>{funcionario.nome}</td>
                            <td>{funcionario.cargo}</td>
                            <td>{funcionario.setor}</td>
                            <td>
                              <span
                                className={
                                  funcionario.vinculo === "Efetivo"
                                    ? "app-status-green"
                                    : "app-status-yellow"
                                }
                              >
                                {funcionario.vinculo}
                              </span>
                            </td>
                            <td>
                              <span
                                className={
                                  funcionario.status === "Ativo"
                                    ? "app-status-green"
                                    : "app-status-yellow"
                                }
                              >
                                {funcionario.status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                aria-label={`Ver detalhes de ${funcionario.nome}`}
                                title="Ver detalhes"
                                onClick={() =>
                                  setFuncionarioAberto(funcionario)
                                }
                                className="cursor-pointer px-2"
                              >
                                •••
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="grid gap-4">
                <div className="app-card p-4">
                  <h2 className="app-report-title mb-4">
                    Distribuição por cargo
                  </h2>

                  <div className="space-y-4">
                    {cargos.map((cargo) => (
                      <div key={cargo.nome}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{cargo.nome}</span>
                          <strong>{carregando ? "..." : cargo.quantidade}</strong>
                        </div>

                        <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10">
                          <div
                            className="h-2 rounded-full bg-[#22c7a9]"
                            style={{
                              width: carregando
                                ? "0%"
                                : larguraGrafico(cargo.quantidade),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="app-card p-4">
                  <h2 className="app-report-title mb-4">
                    Contas de acesso
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Administradores</span>
                      <strong>
                        {carregando
                          ? "..."
                          : funcionarios.filter(
                              (f) => f.tipoAcesso === "ADMINISTRADOR"
                            ).length}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Funcionários</span>
                      <strong>
                        {carregando
                          ? "..."
                          : funcionarios.filter(
                              (f) => f.tipoAcesso === "FUNCIONARIO"
                            ).length}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Acessos ativos</span>
                      <strong>
                        {carregando
                          ? "..."
                          : funcionarios.filter((f) => f.acessoAtivo).length}
                      </strong>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {funcionarioAberto && (
        <DetalhesFuncionario
          funcionario={funcionarioAberto}
          aoFechar={() => setFuncionarioAberto(null)}
          aoAtualizar={carregarFuncionarios}
          podeEditar={pode("usuarios.gerenciar")}
          podeExcluir={pode("usuarios.gerenciar")}
        />
      )}

      {cadastroAberto && (
        <NovoFuncionario
          aoFechar={() => setCadastroAberto(false)}
          aoSalvar={aoCadastrar}
          proximoId={proximoId}
          funcionariosExistentes={funcionarios}
        />
      )}
    </main>
  );
}
  