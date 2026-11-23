
import { useEffect, useState } from "react";
import { X, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { editarFuncionario, excluirFuncionario } from "~/services/api";
import { mascararCpf } from "~/utils/detalhesAluno";
import {
  validarEmail,
  validarTelefone,
  formatarTelefone,
} from "~/utils/validacoes";
import { formatarDataCurta } from "~/utils/formatacao";

function Campo({ rotulo, valor }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-[#8fb1aa]">{rotulo}</p>
      <p className="text-sm font-medium">{valor || "Não informado"}</p>
    </div>
  );
}

function dataParaInput(data: any) {
  if (!data) return "";
  return String(data).slice(0, 10);
}

const dadosIniciais = {
  matricula: "",
  nome: "",
  dataNascimento: "",
  cpf: "",
  status: "ATIVO",
  tipoVinculo: "",
  cargo: "",
  setor: "",
  dataAdmissao: "",
  jornadaSemanal: 40,
  telefone: "",
  email: "",
  endereco: "",
  tipoAcesso: "FUNCIONARIO",
  acessoAtivo: true,
  fotoPerfil: "",
};

export function DetalhesFuncionario({
  funcionario,
  aoFechar,
  aoAtualizar,
  podeEditar,
  podeExcluir,
}: any) {
  const [cpfVisivel, setCpfVisivel] = useState(false);
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const [dados, setDados] = useState<any>(dadosIniciais);

  useEffect(() => {
    setCpfVisivel(false);
    setEditando(false);
    setErro("");
    setAviso("");

    setDados({
      matricula: String(funcionario.matricula ?? ""),
      nome: String(funcionario.nome ?? ""),
      dataNascimento: dataParaInput(funcionario.dataNascimento),
      cpf: String(funcionario.cpf ?? funcionario.detalhes?.cpf ?? ""),
      status:
        funcionario.statusBackend ??
        (funcionario.status === "Ativo"
          ? "ATIVO"
          : funcionario.status === "Inativo"
            ? "INATIVO"
            : "BLOQUEADO"),
      tipoVinculo: String(funcionario.tipoVinculo ?? ""),
      cargo: String(funcionario.cargo ?? ""),
      setor: String(funcionario.setor ?? ""),
      dataAdmissao: dataParaInput(funcionario.dataAdmissao),
      jornadaSemanal: funcionario.jornadaSemanal ?? 40,
      telefone: String(
        funcionario.telefone ?? funcionario.detalhes?.telefone ?? ""
      ),
      email: String(funcionario.email ?? funcionario.detalhes?.email ?? ""),
      endereco: String(
        funcionario.endereco ?? funcionario.detalhes?.endereco ?? ""
      ),
      tipoAcesso: funcionario.tipoAcesso ?? "FUNCIONARIO",
      acessoAtivo: funcionario.acessoAtivo ?? true,
      fotoPerfil: funcionario.fotoPerfil ?? "",
    });
  }, [funcionario]);

  useEffect(() => {
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape" && !carregando) {
        aoFechar();
      }
    }

    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, [aoFechar, carregando]);

  function alterar(campo: string, valor: any) {
    setDados((anterior: any) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function comecarEdicao() {
    setErro("");
    setAviso("");
    setEditando(true);
  }

  async function salvar() {
    let mensagem = "";

    if (!String(dados.nome ?? "").trim()) {
      mensagem = "Informe o nome do funcionário.";
    } else if (!String(dados.matricula ?? "").trim()) {
      mensagem = "Informe a matrícula.";
    } else if (!String(dados.cpf ?? "").trim()) {
      mensagem = "Informe o CPF.";
    } else if (!String(dados.cargo ?? "").trim()) {
      mensagem = "Informe o cargo.";
    } else if (!String(dados.setor ?? "").trim()) {
      mensagem = "Informe o setor.";
    } else if (!String(dados.telefone ?? "").trim()) {
      mensagem = "Informe o telefone.";
    } else {
      mensagem = validarTelefone(String(dados.telefone ?? ""));
    }

    if (!mensagem) {
      mensagem = validarEmail(String(dados.email ?? ""));
    }

    if (!mensagem && String(dados.endereco ?? "").trim().length < 5) {
      mensagem = "Informe um endereço válido.";
    }

    if (!mensagem && Number(dados.jornadaSemanal) <= 0) {
      mensagem = "Informe uma jornada semanal válida.";
    }

    if (mensagem) {
      setErro(mensagem);
      return;
    }

    const payload = {
      matricula: String(dados.matricula ?? "").trim(),
      nome: String(dados.nome ?? "").trim(),
      dataNascimento: dados.dataNascimento || null,
      cpf: String(dados.cpf ?? "").replace(/\D/g, ""),
      status: dados.status,
      tipoVinculo: dados.tipoVinculo,
      cargo: String(dados.cargo ?? "").trim(),
      setor: String(dados.setor ?? "").trim(),
      dataAdmissao: dados.dataAdmissao || null,
      jornadaSemanal: Number(dados.jornadaSemanal),
      telefone: String(dados.telefone ?? "").replace(/\D/g, ""),
      email: String(dados.email ?? "").trim(),
      endereco: String(dados.endereco ?? "").trim(),
      tipoAcesso: dados.tipoAcesso,
      acessoAtivo: dados.acessoAtivo,
      fotoPerfil: dados.fotoPerfil,
    };

    try {
      setCarregando(true);
      setErro("");

      await editarFuncionario(funcionario.id, payload);

      await aoAtualizar?.();
      aoFechar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o funcionário."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function excluir() {
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir ${funcionario.nome}? Essa ação não poderá ser desfeita.`
    );

    if (!confirmado) return;

    try {
      setCarregando(true);
      setErro("");

      await excluirFuncionario(funcionario.id);

      await aoAtualizar?.();
      aoFechar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o funcionário."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={"Detalhes de " + funcionario.nome}
        className="app-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{funcionario.nome}</h2>
            <p className="app-muted text-sm">
              {funcionario.cargo} · Matrícula {dados.matricula}
            </p>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {aviso && (
          <p className="mb-4 rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-500">
            {aviso}
          </p>
        )}

        {erro && (
          <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
            {erro}
          </p>
        )}

        {!editando ? (
          <>
            <h3 className="app-report-title mb-2">Dados do funcionário</h3>

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Campo rotulo="Nome" valor={dados.nome} />
              <Campo rotulo="Matrícula" valor={dados.matricula} />
              <Campo
                rotulo="Data de nascimento"
                valor={formatarDataCurta(dados.dataNascimento)}
              />

              <div>
                <p className="text-xs text-gray-500 dark:text-[#8fb1aa]">
                  CPF
                </p>
                <p className="flex items-center gap-2 text-sm font-medium">
                  {cpfVisivel
                    ? dados.cpf || "Não informado"
                    : mascararCpf(String(dados.cpf ?? ""))}
                  <button
                    type="button"
                    onClick={() => setCpfVisivel(!cpfVisivel)}
                    aria-label={cpfVisivel ? "Ocultar CPF" : "Mostrar CPF"}
                    className="cursor-pointer text-[#22c7a9]"
                  >
                    {cpfVisivel ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </p>
              </div>

              <Campo rotulo="Status" valor={dados.status} />
            </div>

            <h3 className="app-report-title mb-2">Vínculo</h3>

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Campo rotulo="Tipo de vínculo" valor={dados.tipoVinculo} />
              <Campo rotulo="Cargo" valor={dados.cargo} />
              <Campo rotulo="Setor" valor={dados.setor} />
              <Campo
                rotulo="Data de admissão"
                valor={formatarDataCurta(dados.dataAdmissao)}
              />
              <Campo
                rotulo="Jornada"
                valor={`${dados.jornadaSemanal} horas semanais`}
              />
            </div>

            <h3 className="app-report-title mb-2">Contato</h3>

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Campo
                rotulo="Telefone"
                valor={formatarTelefone(String(dados.telefone ?? ""))}
              />
              <Campo rotulo="E-mail" valor={dados.email} />
              <div className="col-span-2 md:col-span-3">
                <Campo rotulo="Endereço" valor={dados.endereco} />
              </div>
            </div>

            <h3 className="app-report-title mb-2">Acesso ao sistema</h3>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <Campo rotulo="Tipo de acesso" valor={dados.tipoAcesso} />
              <Campo
                rotulo="Acesso"
                valor={dados.acessoAtivo ? "Ativo" : "Desativado"}
              />
            </div>
          </>
        ) : (
          <>
            <h3 className="app-report-title mb-3">Editar funcionário</h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Nome
                </label>
                <input
                  className="app-input w-full"
                  value={dados.nome}
                  onChange={(e) => alterar("nome", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Matrícula
                </label>
                <input
                  className="app-input w-full"
                  value={dados.matricula}
                  onChange={(e) => alterar("matricula", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  className="app-input w-full"
                  value={dados.dataNascimento}
                  onChange={(e) => alterar("dataNascimento", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  CPF
                </label>
                <input
                  className="app-input w-full"
                  value={dados.cpf}
                  onChange={(e) => alterar("cpf", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Status
                </label>
                <select
                  className="app-input w-full"
                  value={dados.status}
                  onChange={(e) => alterar("status", e.target.value)}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Tipo de vínculo
                </label>
                <select
                  className="app-input w-full"
                  value={dados.tipoVinculo}
                  onChange={(e) => alterar("tipoVinculo", e.target.value)}
                >
                  <option value="EFETIVO">Efetivo</option>
                  <option value="CONTRATADO">Contratado</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Cargo
                </label>
                <input
                  className="app-input w-full"
                  value={dados.cargo}
                  onChange={(e) => alterar("cargo", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Setor
                </label>
                <input
                  className="app-input w-full"
                  value={dados.setor}
                  onChange={(e) => alterar("setor", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Data de admissão
                </label>
                <input
                  type="date"
                  className="app-input w-full"
                  value={dados.dataAdmissao}
                  onChange={(e) => alterar("dataAdmissao", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Jornada semanal
                </label>
                <input
                  type="number"
                  min="1"
                  className="app-input w-full"
                  value={dados.jornadaSemanal}
                  onChange={(e) =>
                    alterar("jornadaSemanal", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Telefone
                </label>
                <input
                  className="app-input w-full"
                  value={dados.telefone}
                  onChange={(e) =>
                    alterar(
                      "telefone",
                      formatarTelefone(String(e.target.value ?? ""))
                    )
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  E-mail
                </label>
                <input
                  type="email"
                  className="app-input w-full"
                  value={dados.email}
                  onChange={(e) => alterar("email", e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">
                  Endereço
                </label>
                <input
                  className="app-input w-full"
                  value={dados.endereco}
                  onChange={(e) => alterar("endereco", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Tipo de acesso
                </label>
                <select
                  className="app-input w-full"
                  value={dados.tipoAcesso}
                  onChange={(e) => alterar("tipoAcesso", e.target.value)}
                >
                  <option value="FUNCIONARIO">Funcionário</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={dados.acessoAtivo}
                  onChange={(e) => alterar("acessoAtivo", e.target.checked)}
                />
                <label className="text-sm">Acesso ativo</label>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={carregando}
                onClick={() => {
                  setEditando(false);
                  setErro("");
                }}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={carregando}
                onClick={salvar}
                className="app-button-relatorio"
              >
                {carregando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            {podeEditar && !editando && (
              <button
                type="button"
                disabled={carregando}
                onClick={comecarEdicao}
                className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#22c7a9]"
              >
                <Pencil size={16} />
                Editar funcionário
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {podeExcluir && !editando && (
              <button
                type="button"
                disabled={carregando}
                onClick={excluir}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {carregando ? "Excluindo..." : "Excluir funcionário"}
              </button>
            )}

            <button
              type="button"
              disabled={carregando}
              onClick={aoFechar}
              className="app-button-relatorio"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
