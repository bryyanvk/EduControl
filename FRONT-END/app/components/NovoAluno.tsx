import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CampoFormulario } from "~/components/CampoFormulario";
import { enviarAluno } from "~/services/api";
import { alunoParaBack, BACK_TEM_CAMPOS_DO_ALUNO } from "~/utils/conversaoBack";
import { textoDaData } from "~/utils/filtros";
import {
  validarNome,
  validarCpf,
  validarEmail,
  validarTelefone,
  validarDataNascimento,
  formatarCpf,
  formatarTelefone,
  apenasDigitos,
} from "~/utils/validacoes";

const PARENTESCOS = ["Mãe", "Pai", "Avó", "Avô", "Tia", "Tio", "Outro"];

export function NovoAluno({ aoFechar, aoSalvar, alunosExistentes, turmas }: any) {
  const [form, setForm] = useState({
   nome: "",
   matricula: "",
   dataMatricula: textoDaData(new Date()),
   turma: "Sem turma",
   turno: "Manhã",
   dataNascimento: "",
   cpf: "",
   cartao: "",
   responsavelNome: "",
   parentesco: "Mãe",
   responsavelTelefone: "",
   responsavelEmail: "",
   endereco: "",
  });
  const [erros, setErros] = useState<any>({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  const opcoesDeTurma = ["Sem turma"];
  for (let i = 0; i < turmas.length; i++) {
    opcoesDeTurma.push(turmas[i].nome);
  }

  function cartaoEmUso(cartao: string) {
    for (let i = 0; i < alunosExistentes.length; i++) {
      if (alunosExistentes[i].cartao === cartao.trim()) {
        return true;
      }
    }
    return false;
  }

  function cpfEmUso(cpf: string) {
    for (let i = 0; i < alunosExistentes.length; i++) {
      const cpfDoAluno = alunosExistentes[i].detalhes.cpf;
      if (cpfDoAluno !== "" && apenasDigitos(cpfDoAluno) === apenasDigitos(cpf)) {
        return true;
      }
    }
    return false;
  }

  useEffect(() => {
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        aoFechar();
      }
    }
    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, []);

  function mudar(campo: string, valor: string) {
    const novo: any = { ...form };
    novo[campo] = valor;
    setForm(novo);
  }

  function salvar() {
    const novosErros: any = {};

    novosErros.nome = validarNome(form.nome);
    novosErros.dataNascimento = validarDataNascimento(form.dataNascimento, 5, 20);
    novosErros.cpf = validarCpf(form.cpf);
    novosErros.cartao = "";
   novosErros.cartao = "";

  if (form.cartao.trim() === "") {
    novosErros.cartao = "Informe o número do cartão RFID.";
  } else if (form.cartao.trim().length < 4) {
    novosErros.cartao = "O cartão deve ter pelo menos 4 caracteres.";
  } else if (cartaoEmUso(form.cartao)) {
    novosErros.cartao = "Esse cartão já está vinculado a outro aluno.";
  
  }
    novosErros.responsavelNome = validarNome(form.responsavelNome);
    novosErros.responsavelTelefone = validarTelefone(form.responsavelTelefone);
    if (novosErros.responsavelTelefone === "" && apenasDigitos(form.responsavelTelefone) === "") {
      novosErros.responsavelTelefone = "Informe o telefone do responsável.";
    }
    novosErros.responsavelEmail = validarEmail(form.responsavelEmail);
    if (form.endereco.trim().length < 5) {
      novosErros.endereco = "Informe o endereço.";
    }

    if (novosErros.nome === "") {
      const todos = alunosExistentes;
      for (let i = 0; i < todos.length; i++) {
        if (todos[i].turma === form.turma && todos[i].nome.toLowerCase() === form.nome.trim().toLowerCase()) {
          novosErros.nome = "Já existe um aluno com esse nome nesta turma.";
        }
      }
    }
    if (novosErros.cpf === "" && cpfEmUso(form.cpf)) {
      novosErros.cpf = "Já existe um aluno cadastrado com esse CPF.";
    }

    setErros(novosErros);
    const campos = Object.keys(novosErros);
    for (let i = 0; i < campos.length; i++) {
      if (novosErros[campos[i]] !== "") {
        setErroGeral("Corrija os campos destacados.");
        return;
      }
    }

    let maiorId = 0;
    for (let i = 0; i < alunosExistentes.length; i++) {
      if (alunosExistentes[i].id > maiorId) {
        maiorId = alunosExistentes[i].id;
      }
    }
    const id = maiorId + 1;
    const hoje = textoDaData(new Date());
    const matricula = hoje.slice(0, 4) + String(id).padStart(4, "0");
    const aluno = alunoParaBack(form, id, matricula, hoje);

    setSalvando(true);
    enviarAluno(aluno)
      .then(() => {
        setSalvando(false);
        aoSalvar({ nome: form.nome.trim() });
      })
      .catch(() => {
        setSalvando(false);
        setErroGeral("Não foi possível salvar. O back está rodando?");
      });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novo aluno"
        className="app-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Novo aluno</h2>
            <p className="app-muted text-sm">A matrícula é gerada automaticamente com a data de hoje.</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <h3 className="app-report-title mb-2">Dados do aluno</h3>
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario rotulo="Nome completo" erro={erros.nome} className="md:col-span-2">
            <input className="app-input w-full" value={form.nome} onChange={(e) => mudar("nome", e.target.value)} />
          </CampoFormulario>
          <CampoFormulario rotulo="Data de nascimento" erro={erros.dataNascimento}>
            <input
              type="date"
              className="app-input w-full"
              value={form.dataNascimento}
              onChange={(e) => mudar("dataNascimento", e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="CPF" erro={erros.cpf}>
            <input
              className="app-input w-full"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => mudar("cpf", formatarCpf(e.target.value))}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="Cartão RFID (4 a 10 dígitos)" erro={erros.cartao}>
            <input
              className="app-input w-full"
              placeholder="1234"
              inputMode="numeric"
              value={form.cartao}
              onChange={(e) => mudar("cartao", e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="Turma">
            <select className="app-input w-full" value={form.turma} onChange={(e) => mudar("turma", e.target.value)}>
              {opcoesDeTurma.map((turma) => (
                <option key={turma}>{turma}</option>
              ))}
            </select>
          </CampoFormulario>
          <CampoFormulario rotulo="Turno">
            <select className="app-input w-full" value={form.turno} onChange={(e) => mudar("turno", e.target.value)}>
              <option>Manhã</option>
              <option>Tarde</option>
            </select>
          </CampoFormulario>
        </div>

        <h3 className="app-report-title mb-2">Responsável</h3>
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario rotulo="Nome do responsável" erro={erros.responsavelNome}>
            <input
              className="app-input w-full"
              value={form.responsavelNome}
              onChange={(e) => mudar("responsavelNome", e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="Parentesco">
            <select
              className="app-input w-full"
              value={form.parentesco}
              onChange={(e) => mudar("parentesco", e.target.value)}
            >
              {PARENTESCOS.map((parentesco) => (
                <option key={parentesco}>{parentesco}</option>
              ))}
            </select>
          </CampoFormulario>
          <CampoFormulario rotulo="Telefone" erro={erros.responsavelTelefone}>
            <input
              className="app-input w-full"
              placeholder="(35) 99999-9999"
              value={form.responsavelTelefone}
              onChange={(e) => mudar("responsavelTelefone", formatarTelefone(e.target.value))}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="E-mail" erro={erros.responsavelEmail}>
            <input
              className="app-input w-full"
              value={form.responsavelEmail}
              onChange={(e) => mudar("responsavelEmail", e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="Endereço" erro={erros.endereco} className="md:col-span-2">
            <input
              className="app-input w-full"
              value={form.endereco}
              onChange={(e) => mudar("endereco", e.target.value)}
            />
          </CampoFormulario>
        </div>

        {erroGeral !== "" && <p className="mb-3 text-sm text-red-500">{erroGeral}</p>}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            {BACK_TEM_CAMPOS_DO_ALUNO
              ? "Salvo no back-end."
              : "Por enquanto o back guarda só nome, nascimento, cartão e matrícula."}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={aoFechar} className="cursor-pointer rounded-lg px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="button" onClick={salvar} disabled={salvando} className="app-button-relatorio">
              {salvando ? "Salvando..." : "Salvar aluno"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
