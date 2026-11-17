import {
  DoorOpen,
  Search,
  Plus,
  WrenchOff,
  ChartNoAxesCombined,
  Building2,
  DoorClosed,
  Filter,
  Pencil,
  Trash2,
} from "lucide-react";
import { Notificacoes } from "~/components/Notificacoes";
import { NovaSala } from "~/components/NovaSala";
import { NovaTurma } from "~/components/NovaTurma";
import { ConfirmarExclusao } from "~/components/ConfirmarExclusao";
import { buscarSalas, buscarTurmas, editarSala, excluirSala, excluirTurma } from "~/services/api";
import { salaDoBack, statusParaBack } from "~/utils/conversaoBack";
import { Sidebar } from "~/components/Sidebar";
import { useEffect, useState } from "react";
import { filtrarSalas } from "~/utils/filtros";
import { useUsuario } from "~/hooks/useUsuario";
import Lohran from "../../../public/lohran-avatar.png";


export function Salas() {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const { pode, usuario } = useUsuario();
  const [salasDoBack, setSalasDoBack] = useState<any[]>([]);
  const [turmasDoBack, setTurmasDoBack] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroBack, setErroBack] = useState("");
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [turmaAberta, setTurmaAberta] = useState(false);
  const [aviso, setAviso] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [salaParaEditar, setSalaParaEditar] = useState<any>(null);
  const [turmaParaEditar, setTurmaParaEditar] = useState<any>(null);
  const [salaParaExcluir, setSalaParaExcluir] = useState<any>(null);
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<any>(null);
  const todasSalas = salasDoBack;

  function carregar() {
    buscarSalas()
      .then((dados) => {
        const lista = [];
        for (let i = 0; i < dados.length; i++) {
          lista.push(salaDoBack(dados[i]));
        }
        setSalasDoBack(lista);
        setErroBack("");
        setCarregando(false);
      })
      .catch(() => {
        setErroBack("Não foi possível carregar as salas. O back está rodando?");
        setCarregando(false);
      });

    buscarTurmas()
      .then((dados) => setTurmasDoBack(dados))
      .catch(() => setTurmasDoBack([]));
  }

  useEffect(() => {
    carregar();
  }, []);

  let emUso = 0;
  let disponiveis = 0;
  let emManutencao = 0;
  for (let i = 0; i < todasSalas.length; i++) {
    if (todasSalas[i].cor === "Em uso") {
      emUso = emUso + 1;
    }
    if (todasSalas[i].cor === "Disponível") {
      disponiveis = disponiveis + 1;
    }
    if (todasSalas[i].cor === "Em manutenção") {
      emManutencao = emManutencao + 1;
    }
  }

  function mostrarAviso(texto: string) {
    setErroAcao("");
    setAviso(texto);
    setTimeout(() => setAviso(""), 6000);
  }

  function fecharSala() {
    setCadastroAberto(false);
    setSalaParaEditar(null);
  }

  function fecharTurma() {
    setTurmaAberta(false);
    setTurmaParaEditar(null);
  }

  function aoCadastrar(sala: any) {
    carregar();
    fecharSala();
    if (sala.editou) {
      mostrarAviso(sala.nome + " foi atualizada.");
      return;
    }
    setBusca("");
    setAndar("Todos os andares");
    setStatus("Todos os status");
    setTurma("Todas as turmas");
    mostrarAviso(sala.nome + " foi cadastrada.");
  }

  function atualizarSalasDaTurma(turma: any) {
    const chamadas = [];
    for (let i = 0; i < todasSalas.length; i++) {
      const sala = todasSalas[i];
      if (sala.turma === turma.nomeAntigo) {
        const salaParaEnviar = {
          numero: sala.numero,
          capacidade: parseInt(sala.capacidade, 10),
          andar: sala.andar,
          status: statusParaBack(sala.cor),
          turma: { id: turma.id, nome: turma.nome, curso: turma.curso },
        };
        chamadas.push(editarSala(sala.numero, salaParaEnviar));
      }
    }
    Promise.all(chamadas)
      .then(() => {
        carregar();
        mostrarAviso(turma.nome + " foi atualizada.");
      })
      .catch(() => {
        carregar();
        setErroAcao("A turma foi atualizada, mas não foi possível atualizar as salas dela.");
      });
  }

  function aoCadastrarTurma(turma: any) {
    fecharTurma();
    if (turma.editou) {
      atualizarSalasDaTurma(turma);
      return;
    }
    carregar();
    mostrarAviso(turma.nome + " foi cadastrada.");
  }

  function pedirExclusaoDaTurma(turma: any) {
    for (let i = 0; i < todasSalas.length; i++) {
      if (todasSalas[i].turma === turma.nome) {
        setErroAcao(turma.nome + " está na " + todasSalas[i].nome + ". Tire a turma da sala antes de excluir.");
        return;
      }
    }
    setErroAcao("");
    setTurmaParaExcluir(turma);
  }

  function confirmarExclusaoDaSala() {
    const nome = salaParaExcluir.nome;
    excluirSala(salaParaExcluir.numero)
      .then(() => {
        carregar();
        setSalaParaExcluir(null);
        mostrarAviso(nome + " foi excluída.");
      })
      .catch(() => {
        setSalaParaExcluir(null);
        setErroAcao("Não foi possível excluir a sala. O back está rodando?");
      });
  }

  function confirmarExclusaoDaTurma() {
    const nome = turmaParaExcluir.nome;
    excluirTurma(turmaParaExcluir.id)
      .then(() => {
        carregar();
        setTurmaParaExcluir(null);
        mostrarAviso(nome + " foi excluída.");
      })
      .catch(() => {
        setTurmaParaExcluir(null);
        setErroAcao("Não foi possível excluir a turma. O back está rodando?");
      });
  }

  let proximoIdDeTurma = 1;
  for (let i = 0; i < turmasDoBack.length; i++) {
    if (turmasDoBack[i].id >= proximoIdDeTurma) {
      proximoIdDeTurma = turmasDoBack[i].id + 1;
    }
  }

  const [busca, setBusca] = useState("");
  const [andar, setAndar] = useState("Todos os andares");
  const [status, setStatus] = useState("Todos os status");
  const [turma, setTurma] = useState("Todas as turmas");

  const colunas = pode("salas.gerenciar") ? 6 : 5;
  const salas = filtrarSalas(todasSalas, busca, andar, status, turma);
  return (
    <main className="app-shell">
   
      <Sidebar ativo="/salas" />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="app-header">
            <div>
              <h1 className="text-2xl font-bold">Salas e turmas</h1>
              <p className="app-muted">
                {pode("salas.gerenciar")
                  ? "Gerencie as salas e turmas da sua instituição"
                  : "Consulte as salas e turmas da sua instituição"}
              </p>
            </div>

        


            <div className="app-header-actions">
              {pode("salas.gerenciar") && (
                <button
                  type="button"
                  onClick={() => setCadastroAberto(true)}
                  className="app-button-relatorio">
                  <Plus size={18} />
                  Nova sala
                </button>
              )}
              {pode("salas.gerenciar") && (
                <button
                  type="button"
                  onClick={() => setTurmaAberta(true)}
                  className="app-button-relatorio">
                  <Plus size={18} />
                  Nova turma
                </button>
              )}

              <Notificacoes />
              <div className="app-avatar">
                <img
                  src={Lohran}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-[#f5fffc]">{usuario?.nome ?? ""}</span>
            </div>
          </div>

          <div className="app-grid-relatorio p-5"> 
            <div className="app-report-stat relative">
              <div className="app-report-icon blue">
                <Building2 size={20} />
              </div>
              <div>
                <div>
                  <p>Total de salas</p>
                  <span>{todasSalas.length}</span>
                </div>
                

                <div className="flex justify-end gap-1">
                    <ChartNoAxesCombined
                    size={20}
                    className="absolute bottom-5 right-5 text-blue-300  "
                  />

                </div>
                
              </div>
            </div>

            <div className="app-report-stat relative">
              <div className="app-report-icon green">
                <DoorClosed size={20} />
              </div>
              <div>
                <div>
                  <p>Salas em uso</p>
                  <span>{emUso}</span>
                </div>
                

                <div className="flex justify-end gap-1">
                    <ChartNoAxesCombined 
                    size={20}
                    className="absolute bottom-5 right-5 text-green-300  "
                  />

                </div>
                
              </div>
            </div>

            <div className="app-report-stat relative">
              <div className="app-report-icon gray">
                <DoorOpen size={20} />
              </div>
              <div>
                <div>
                  <p>Salas disponíveis</p>
                  <span>{disponiveis}</span>
                </div>
                

                <div className="flex justify-end gap-1">
                    <ChartNoAxesCombined 
                    size={20}
                    className="absolute bottom-5 right-5 text-gray-300  "
                  />

                </div>
                
              </div>
            </div>

            <div className="app-report-stat relative">
              <div className="app-report-icon red">
                <WrenchOff size={20} />
              </div>  
              <div>
                <div>
                  <p>Salas em manutenção</p>
                  <span>{emManutencao}</span>
                </div>
                

                <div className="flex justify-end gap-1">
                    <ChartNoAxesCombined 
                    size={20}
                    className="absolute bottom-5 right-5 text-red-300  "
                  />

                </div>
                
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

            {erroAcao !== "" && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300"
              >
                {erroAcao}
              </div>
            )}

            <div className="app-report-filters">

              <div className="app-report-search col-span-3">
                <label>Pesquisar</label>
                <div>
                  <Search size={17} />
                  <input
                    placeholder="Buscar sala..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
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
                <label>Andar</label>
                <select value={andar} onChange={(e) => setAndar(e.target.value)}>
                  <option>Todos os andares</option>
                  <option>Térreo</option>
                  <option>1º Andar</option>
                  <option>2º Andar</option>
                </select>
              </div>

              <div>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>Todos os status</option>
                  <option>Em uso</option>
                  <option>Em manutenção</option>
                  <option>Disponível</option>
                </select>
              </div>

              <div>
                <label>Turma</label>
                <select value={turma} onChange={(e) => setTurma(e.target.value)}>
                  <option>Todas as turmas</option>
                  <option>6º Ano</option>
                  <option>7º Ano</option>
                  <option>8º Ano</option>
                  <option>9º Ano</option>
                  <option>1º Ano EM</option>
                  <option>2º Ano EM</option>
                  <option>3º Ano EM</option>
                </select>
              </div>

              </>
              )}
            </div>  


            <div className="app-card min-h-60 p-2">

            <table className="w-full text-left border-collapse ">
              <thead>
              <tr className="border-b  border-slate-200 text-left dark:border-white/10">
                
                <th className=" py-3 p-2">Salas</th>
                <th>Capacidade</th>
                <th>Andar</th>
                <th>Turma</th>
                <th>Status</th>
                {pode("salas.gerenciar") && <th>Ações</th>}
                
              </tr>
            </thead>
              <tbody>
              {carregando && (
                <tr>
                  <td colSpan={colunas} className="py-8 text-center app-muted">
                    Carregando salas...
                  </td>
                </tr>
              )}
              {erroBack !== "" && (
                <tr>
                  <td colSpan={colunas} className="py-8 text-center text-red-500">
                    {erroBack}
                  </td>
                </tr>
              )}
              {salas.length === 0 && carregando === false && erroBack === "" && (
                <tr>
                  <td colSpan={colunas} className="py-8 text-center app-muted">
                    Nenhuma sala encontrada com esses filtros.
                  </td>
                </tr>
              )}
              {salas.map((salas) => (
                <tr
                  key={salas.nome}
                  className="border-b border-slate-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-[#101f27]"
                >
                  <td className="py-3 p-2  ">{salas.nome}</td>
                  <td>{salas.capacidade}</td>
                  <td>{salas.andar}</td>
                  <td>{salas.turma}</td>
                  <td>
                    
                    <span className={salas.cor === "Em uso" ? "app-status-green" : salas.cor === "Em manutenção" ? "app-status-red" : "app-status-gray"}>
                      {salas.cor}
                    </span>
                  </td>
                  {pode("salas.gerenciar") && (
                    <td>
                      <button
                        type="button"
                        title="Editar sala"
                        aria-label="Editar sala"
                        onClick={() => setSalaParaEditar(salas)}
                        className="mr-2 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title="Excluir sala"
                        aria-label="Excluir sala"
                        onClick={() => setSalaParaExcluir(salas)}
                        className="cursor-pointer text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            </table>
          </div>

          <div className="app-card p-2">
            <h2 className="p-2 text-lg font-bold">Turmas</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-white/10">
                  <th className="py-3 p-2">Turma</th>
                  <th>Curso</th>
                  {pode("salas.gerenciar") && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {turmasDoBack.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center app-muted">
                      Nenhuma turma cadastrada.
                    </td>
                  </tr>
                )}
                {turmasDoBack.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-[#101f27]"
                  >
                    <td className="py-3 p-2">{t.nome}</td>
                    <td>{t.curso}</td>
                    {pode("salas.gerenciar") && (
                      <td>
                        <button
                          type="button"
                          title="Editar turma"
                          aria-label="Editar turma"
                          onClick={() => setTurmaParaEditar(t)}
                          className="mr-2 cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Excluir turma"
                          aria-label="Excluir turma"
                          onClick={() => pedirExclusaoDaTurma(t)}
                          className="cursor-pointer text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          </div>

            
          
          
        </div>

        

              
      
    {(cadastroAberto || salaParaEditar !== null) && (
        <NovaSala
          aoFechar={fecharSala}
          aoSalvar={aoCadastrar}
          salasExistentes={todasSalas}
          turmas={turmasDoBack}
          salaEditando={salaParaEditar}
        />
      )}
    {(turmaAberta || turmaParaEditar !== null) && (
        <NovaTurma
          aoFechar={fecharTurma}
          aoSalvar={aoCadastrarTurma}
          turmasExistentes={turmasDoBack}
          proximoId={proximoIdDeTurma}
          turmaEditando={turmaParaEditar}
        />
      )}
    {salaParaExcluir !== null && (
        <ConfirmarExclusao
          titulo="Excluir sala"
          mensagem={"Excluir a " + salaParaExcluir.nome + "? Essa ação não pode ser desfeita."}
          aoConfirmar={confirmarExclusaoDaSala}
          aoCancelar={() => setSalaParaExcluir(null)}
        />
      )}
    {turmaParaExcluir !== null && (
        <ConfirmarExclusao
          titulo="Excluir turma"
          mensagem={"Excluir a turma " + turmaParaExcluir.nome + "? Essa ação não pode ser desfeita."}
          aoConfirmar={confirmarExclusaoDaTurma}
          aoCancelar={() => setTurmaParaExcluir(null)}
        />
      )}
      </main>
  );
}
