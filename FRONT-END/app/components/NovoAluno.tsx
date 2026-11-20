
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CampoFormulario } from "~/components/CampoFormulario";
import { enviarAluno } from "~/services/api";
import { alunoParaBack } from "~/utils/conversaoBack";
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
  const listaAlunos = Array.isArray(alunosExistentes) ? alunosExistentes : [];
  const listaTurmas = Array.isArray(turmas) ? turmas : [];

  const [form, setForm] = useState({
    nome: "",
    matricula: "",
    dataMatricula: textoDaData(new Date()),
    turma: "",
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

  function cartaoEmUso(cartao: string) {
    const valor = cartao.trim().toUpperCase();

    return listaAlunos.some(
      (aluno: any) =>
        String(aluno.cartao || "").trim().toUpperCase() === valor
    );
  }

  function cpfEmUso(cpf: string) {
    const valor = apenasDigitos(cpf);

    return listaAlunos.some((aluno: any) => {
      const cpfDoAluno = aluno.detalhes?.cpf || "";
      return (
        cpfDoAluno !== "" &&
        apenasDigitos(cpfDoAluno) === valor
      );
    });
  }

  function matriculaEmUso(matricula: string) {
    const valor = matricula.trim().toLowerCase();

    return listaAlunos.some((aluno: any) => {
      const matriculaDoAluno = aluno.detalhes?.matricula || "";
      return matriculaDoAluno !== "—" &&
        String(matriculaDoAluno).trim().toLowerCase() === valor;
    });
  }

  useEffect(() => {
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape" && !salvando) {
        aoFechar();
      }
    }

    window.addEventListener("keydown", aoApertar);

    return () => window.removeEventListener("keydown", aoApertar);
  }, [aoFechar, salvando]);

  function mudar(campo: string, valor: string) {
    setForm((anterior: any) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErros((anterior: any) => ({
      ...anterior,
      [campo]: "",
    }));

    setErroGeral("");
  }

  function salvar() {
    if (salvando) return;

    const novosErros: any = {};

    novosErros.nome = validarNome(form.nome);
    novosErros.matricula = "";

    if (form.matricula.trim() === "") {
      novosErros.matricula = "Informe o número da matrícula.";
    } else if (matriculaEmUso(form.matricula)) {
      novosErros.matricula = "Essa matrícula já está cadastrada.";
    }

    novosErros.dataMatricula = "";

    if (!form.dataMatricula) {
      novosErros.dataMatricula = "Informe a data da matrícula.";
    }

    novosErros.dataNascimento = validarDataNascimento(
      form.dataNascimento,
      5,
      20
    );

    novosErros.cpf = validarCpf(form.cpf);

    if (novosErros.cpf === "" && cpfEmUso(form.cpf)) {
      novosErros.cpf = "Já existe um aluno cadastrado com esse CPF.";
    }

    novosErros.cartao = "";

    if (form.cartao.trim() === "") {
      novosErros.cartao = "Informe o cartão RFID.";
    } else if (form.cartao.trim().length < 4) {
      novosErros.cartao = "O cartão deve ter pelo menos 4 caracteres.";
    } else if (cartaoEmUso(form.cartao)) {
      novosErros.cartao = "Esse cartão já está vinculado a outro aluno.";
    }

    novosErros.turma = "";

    if (!form.turma) {
      novosErros.turma = "Selecione uma turma.";
    } else if (
      !listaTurmas.some((turma: any) => turma.nome === form.turma)
    ) {
      novosErros.turma = "A turma selecionada não foi encontrada.";
    }

    novosErros.turno = "";

    if (novosErros.nome === "") {
      for (let i = 0; i < listaAlunos.length; i++) {
        const aluno = listaAlunos[i];

        if (
          aluno.turma === form.turma &&
          aluno.nome?.toLowerCase() === form.nome.trim().toLowerCase()
        ) {
          novosErros.nome = "Já existe um aluno com esse nome nesta turma.";
          break;
        }
      }
    }

    novosErros.responsavelNome = validarNome(form.responsavelNome);
    novosErros.responsavelTelefone = validarTelefone(
      form.responsavelTelefone
    );

    if (
      novosErros.responsavelTelefone === "" &&
      apenasDigitos(form.responsavelTelefone) === ""
    ) {
      novosErros.responsavelTelefone =
        "Informe o telefone do responsável.";
    }

    novosErros.responsavelEmail = validarEmail(form.responsavelEmail);

    novosErros.endereco = "";

    if (form.endereco.trim().length < 5) {
      novosErros.endereco = "Informe o endereço.";
    }

    setErros(novosErros);

    const primeiroErro = Object.values(novosErros).find(
      (erro: any) => erro !== ""
    );

    if (primeiroErro) {
      setErroGeral("Corrija os campos destacados.");
      return;
    }

    const aluno = alunoParaBack(form, listaTurmas);

    setSalvando(true);
    setErroGeral("");

    enviarAluno(aluno)
      .then(() => {
        setSalvando(false);
        aoSalvar({ nome: form.nome.trim() });
      })
      .catch((erro: any) => {
        setSalvando(false);
        setErroGeral(
          erro.message || "Erro desconhecido ao cadastrar aluno."
        );
      });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={salvando ? undefined : aoFechar}
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
            <p className="app-muted text-sm">
              Preencha os dados para cadastrar o aluno no EduControl.
            </p>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            disabled={salvando}
            className="cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <h3 className="app-report-title mb-2">Dados do aluno</h3>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario
            rotulo="Nome completo"
            erro={erros.nome}
            className="md:col-span-2"
          >
            <input
              className="app-input w-full"
              value={form.nome}
              onChange={(e) => mudar("nome", e.target.value)}
            />
          </CampoFormulario>

          <CampoFormulario rotulo="Matrícula" erro={erros.matricula}>
            <input
              className="app-input w-full"
              placeholder="Número da matrícula"
              value={form.matricula}
              onChange={(e) => mudar("matricula", e.target.value)}
            />
          </CampoFormulario>

          <CampoFormulario
            rotulo="Data de matrícula"
            erro={erros.dataMatricula}
          >
            <input
              type="date"
              className="app-input w-full"
              value={form.dataMatricula}
              onChange={(e) => mudar("dataMatricula", e.target.value)}
            />
          </CampoFormulario>

          <CampoFormulario
            rotulo="Data de nascimento"
            erro={erros.dataNascimento}
          >
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
              onChange={(e) =>
                mudar("cpf", formatarCpf(e.target.value))
              }
            />
          </CampoFormulario>

          <CampoFormulario
            rotulo="Cartão RFID (4 a 10 caracteres)"
            erro={erros.cartao}
          >
            <input
              className="app-input w-full"
              placeholder="236096A9"
              value={form.cartao}
              maxLength={10}
              onChange={(e) =>
                mudar(
                  "cartao",
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                )
              }
            />
          </CampoFormulario>

          <CampoFormulario rotulo="Turma" erro={erros.turma}>
            <select
              className="app-input w-full"
              value={form.turma}
              onChange={(e) => mudar("turma", e.target.value)}
            >
              <option value="">Selecione uma turma</option>

              {listaTurmas.map((turma: any) => (
                <option key={turma.id} value={turma.nome}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </CampoFormulario>

          <CampoFormulario rotulo="Turno">
            <select
              className="app-input w-full"
              value={form.turno}
              onChange={(e) => mudar("turno", e.target.value)}
            >
              <option>Manhã</option>
              <option>Tarde</option>
            </select>
          </CampoFormulario>
        </div>

        <h3 className="app-report-title mb-2">Responsável</h3>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario
            rotulo="Nome do responsável"
            erro={erros.responsavelNome}
          >
            <input
              className="app-input w-full"
              value={form.responsavelNome}
              onChange={(e) =>
                mudar("responsavelNome", e.target.value)
              }
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

          <CampoFormulario
            rotulo="Telefone"
            erro={erros.responsavelTelefone}
          >
            <input
              className="app-input w-full"
              placeholder="(35) 99999-9999"
              value={form.responsavelTelefone}
              onChange={(e) =>
                mudar(
                  "responsavelTelefone",
                  formatarTelefone(e.target.value)
                )
              }
            />
          </CampoFormulario>

          <CampoFormulario
            rotulo="E-mail"
            erro={erros.responsavelEmail}
          >
            <input
              className="app-input w-full"
              value={form.responsavelEmail}
              onChange={(e) =>
                mudar("responsavelEmail", e.target.value)
              }
            />
          </CampoFormulario>

          <CampoFormulario
            rotulo="Endereço"
            erro={erros.endereco}
            className="md:col-span-2"
          >
            <input
              className="app-input w-full"
              value={form.endereco}
              onChange={(e) => mudar("endereco", e.target.value)}
            />
          </CampoFormulario>
        </div>

        {erroGeral !== "" && (
          <p className="mb-3 text-sm text-red-500">{erroGeral}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Os dados serão enviados para o backend Java.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={aoFechar}
              disabled={salvando}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm"
            >
              Cancelar
            </button>x

            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="app-button-relatorio"
            >
              {salvando ? "Salvando..." : "Salvar aluno"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
