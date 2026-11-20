import { useEffect, useState } from "react";
import { X, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import {
  detalhesCompletos,
  mascararCpf,
  resumoFrequencia,
} from "~/utils/detalhesAluno";
import {
  validarNome,
  validarEmail,
  validarTelefone,
  formatarTelefone,
} from "~/utils/validacoes";
import { formatarDataCurta } from "~/utils/formatacao";
import { editarAluno, excluirAluno } from "~/services/api";
import { alunoParaBack } from "~/utils/conversaoBack";

function Campo({ rotulo, valor }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-[#8fb1aa]">{rotulo}</p>
      <p className="text-sm font-medium">{valor || "—"}</p>
    </div>
  );
}

function valorReal(valor: any) {
  if (valor === "—" || valor === null || valor === undefined) {
    return "";
  }

  return String(valor);
}

function dataParaInput(data: any) {
  if (!data) return "";

  if (Array.isArray(data)) {
    const ano = String(data[0]).padStart(4, "0");
    const mes = String(data[1]).padStart(2, "0");
    const dia = String(data[2]).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  return String(data).slice(0, 10);
}

export function DetalhesAluno({
  aluno,
  aoFechar,
  podeEditar,
  podeExcluir,
  turmas = [],
  aoAtualizar,
  aoExcluir,
}: any) {
  const [dados, setDados] = useState<any>(() => detalhesCompletos(aluno));
  const [cpfVisivel, setCpfVisivel] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [nome, setNome] = useState(aluno.nome || "");
  const [matricula, setMatricula] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [dataMatricula, setDataMatricula] = useState("");
  const [cartao, setCartao] = useState(aluno.cartao || "");
  const [cpf, setCpf] = useState("");
  const [turma, setTurma] = useState(aluno.turma || "");
  const [turno, setTurno] = useState("");

  const [responsavelNome, setResponsavelNome] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const frequencia = resumoFrequencia(aluno);

  useEffect(() => {
    const novosDados = detalhesCompletos(aluno);

    setDados(novosDados);
    setNome(aluno.nome || "");
    setMatricula(valorReal(novosDados.matricula));
    setDataNascimento(dataParaInput(novosDados.dataNascimento));
    setDataMatricula(dataParaInput(novosDados.dataMatricula));
    setCartao(aluno.cartao || "");
    setCpf(valorReal(novosDados.cpf));
    setTurma(aluno.turma || "");
    setTurno(valorReal(novosDados.turno));
    setResponsavelNome(valorReal(novosDados.responsavelNome));
    setParentesco(valorReal(novosDados.parentesco));
    setTelefone(formatarTelefone(novosDados.responsavelTelefone));
    setEmail(valorReal(novosDados.responsavelEmail));
    setEndereco(valorReal(novosDados.endereco));
    setEditando(false);
    setErro("");
    setAviso("");
  }, [aluno]);

  useEffect(() => {
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape" && !salvando && !excluindo) {
        aoFechar();
      }
    }

    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, [aoFechar, salvando, excluindo]);

  function comecarEdicao() {
    setErro("");
    setAviso("");
    setEditando(true);
  }

  async function salvar() {
    let mensagem = validarNome(nome);

    if (mensagem === "" && matricula.trim() === "") {
      mensagem = "Informe a matrícula do aluno.";
    }

    if (mensagem === "" && !dataNascimento) {
      mensagem = "Informe a data de nascimento.";
    }

    if (mensagem === "" && cartao.trim() === "") {
      mensagem = "Informe o cartão RFID.";
    }

    if (mensagem === "" && !turmas.some((t: any) => t.nome === turma)) {
      mensagem = "Selecione uma turma válida.";
    }

    if (mensagem === "") {
      mensagem = validarNome(responsavelNome);
    }

    if (mensagem === "") {
      mensagem = validarTelefone(telefone);
    }

    if (mensagem === "" && telefone.trim() === "") {
      mensagem = "Informe o telefone do responsável.";
    }

    if (mensagem === "") {
      mensagem = validarEmail(email);
    }

    if (mensagem === "" && endereco.trim().length < 5) {
      mensagem = "Informe o endereço.";
    }

    if (mensagem !== "") {
      setErro(mensagem);
      return;
    }

    let alunoParaEnviar: any;

    try {
      alunoParaEnviar = alunoParaBack(
        {
          nome,
          matricula,
          dataMatricula,
          dataNascimento,
          cartao,
          cpf,
          turma,
          turno,
          responsavelNome,
          parentesco,
          responsavelTelefone: telefone.replace(/\D/g, ""),
          responsavelEmail: email,
          endereco,
        },
        turmas,
      );
    } catch (e: any) {
      setErro(e.message || "Não foi possível preparar os dados do aluno.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      await editarAluno(aluno.id, alunoParaEnviar);
      setEditando(false);
      aoAtualizar?.("Dados de " + nome.trim() + " atualizados com sucesso.");
    } catch (e: any) {
      setErro(e.message || "Não foi possível atualizar o aluno.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o aluno ${aluno.nome}? Essa ação não poderá ser desfeita.`
    );

    if (!confirmar) return;

    setExcluindo(true);
    setErro("");

    try {
      await excluirAluno(aluno.id);
      aoExcluir?.("Aluno " + aluno.nome + " excluído com sucesso.");
    } catch (e: any) {
      setErro(e.message || "Não foi possível excluir o aluno.");
    } finally {
      setExcluindo(false);
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
        aria-label={"Detalhes de " + aluno.nome}
        className="app-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{aluno.nome}</h2>
            <p className="app-muted text-sm">
              {aluno.turma} · Matrícula {dados.matricula}
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

        {aviso !== "" && (
          <p className="mb-4 rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-500">
            {aviso}
          </p>
        )}

        {erro !== "" && (
          <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
            {erro}
          </p>
        )}

        {editando ? (
          <>
            <h3 className="app-report-title mb-2">Dados do aluno</h3>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Nome do aluno</label>
                <input className="app-input w-full" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Matrícula</label>
                <input className="app-input w-full" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Data de nascimento</label>
                <input type="date" className="app-input w-full" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Data da matrícula</label>
                <input type="date" className="app-input w-full" value={dataMatricula} onChange={(e) => setDataMatricula(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Cartão RFID</label>
                <input className="app-input w-full" value={cartao} onChange={(e) => setCartao(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">CPF</label>
                <input className="app-input w-full" value={cpf} onChange={(e) => setCpf(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Turma</label>
                <select className="app-input w-full" value={turma} onChange={(e) => setTurma(e.target.value)}>
                  <option value="">Selecione uma turma</option>
                  {turmas.map((t: any) => (
                    <option key={t.id} value={t.nome}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Turno</label>
                <input className="app-input w-full" value={turno} onChange={(e) => setTurno(e.target.value)} />
              </div>
            </div>

            <h3 className="app-report-title mb-2">Responsável</h3>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Nome do responsável</label>
                <input className="app-input w-full" value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Parentesco</label>
                <input className="app-input w-full" value={parentesco} onChange={(e) => setParentesco(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Telefone</label>
                <input className="app-input w-full" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">E-mail</label>
                <input className="app-input w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Endereço</label>
                <input className="app-input w-full" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditando(false)} className="cursor-pointer rounded-lg px-4 py-2 text-sm">
                Cancelar
              </button>

              <button type="button" onClick={salvar} disabled={salvando} className="app-button-relatorio">
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="app-report-title mb-2">Dados do aluno</h3>

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Campo rotulo="Data de nascimento" valor={formatarDataCurta(dados.dataNascimento) + " (" + dados.idade + " anos)"} />

              <div>
                <p className="text-xs text-gray-500 dark:text-[#8fb1aa]">CPF</p>
                <p className="flex items-center gap-2 text-sm font-medium">
                  {dados.cpf === "" ? "—" : cpfVisivel ? dados.cpf : mascararCpf(dados.cpf)}
                  <button type="button" onClick={() => setCpfVisivel(!cpfVisivel)} aria-label={cpfVisivel ? "Ocultar CPF" : "Mostrar CPF"} className="cursor-pointer text-[#22c7a9]">
                    {cpfVisivel ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </p>
              </div>

              <Campo rotulo="Data da matrícula" valor={formatarDataCurta(dados.dataMatricula)} />
              <Campo rotulo="Turma" valor={aluno.turma} />
              <Campo rotulo="Cartão RFID" valor={aluno.cartao} />
              <Campo rotulo="Turno" valor={dados.turno} />
              <Campo rotulo="Situação" valor={aluno.situacao} />
            </div>

            <h3 className="app-report-title mb-2">Responsável</h3>

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Campo rotulo="Nome" valor={dados.responsavelNome} />
              <Campo rotulo="Parentesco" valor={dados.parentesco} />
              <Campo rotulo="Telefone" valor={formatarTelefone(dados.responsavelTelefone)} />
              <Campo rotulo="E-mail" valor={dados.responsavelEmail} />
              <div className="col-span-2">
                <Campo rotulo="Endereço" valor={dados.endereco} />
              </div>
            </div>
          </>
        )}

        <h3 className="app-report-title mb-2">Frequência</h3>

        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Campo rotulo="Presença geral" valor={aluno.presenca} />
          <Campo rotulo="Presentes (40 dias)" valor={frequencia.presentes} />
          <Campo rotulo="Atrasos" valor={frequencia.atrasos} />
          <Campo rotulo="Faltas" valor={frequencia.faltas} />
          <Campo rotulo="Justificadas" valor={frequencia.justificadas} />
        </div>

        <table className="mb-4 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="py-2">Data</th>
              <th>Status</th>
              <th>Entrada</th>
            </tr>
          </thead>

          <tbody>
            {frequencia.recentes.map((linha: any) => (
              <tr key={linha.id} className="border-b border-slate-200 dark:border-white/5">
                <td className="py-2">{formatarDataCurta(linha.data)}</td>
                <td>{linha.status}</td>
                <td>{linha.entrada}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Alterações são salvas diretamente no back-end.
          </p>

          <div className="flex gap-2">
            {podeEditar && !editando && (
              <button type="button" onClick={comecarEdicao} className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#22c7a9]">
                <Pencil size={16} />
                Editar aluno
              </button>
            )}

            {podeExcluir && (
              <button
                type="button"
                onClick={excluir}
                disabled={excluindo || salvando}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-500 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {excluindo ? "Excluindo..." : "Excluir aluno"}
              </button>
            )}

            <button type="button" onClick={aoFechar} className="app-button-relatorio">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}