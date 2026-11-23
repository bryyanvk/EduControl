
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CampoFormulario } from "~/components/CampoFormulario";
import { enviarFuncionario } from "~/services/api";
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

const CARGOS = [
  "Professor(a)",
  "Coordenador(a)",
  "Diretor(a)",
  "Secretário(a)",
  "Supervisor(a)",
  "Auxiliar administrativo",
];

const SETORES = [
  "Pedagógico",
  "Administrativo",
  "Gestão",
  "Ensino Fundamental",
  "Ensino Médio",
  "Apoio",
];

const JORNADAS = [
  "20 horas semanais",
  "24 horas semanais",
  "30 horas semanais",
  "40 horas semanais",
];

export function NovoFuncionario({
  aoFechar,
  aoSalvar,
  proximoId,
  funcionariosExistentes,
}: any) {
  const [form, setForm] = useState({
    nome: "",
    cargo: "Professor(a)",
    setor: "Pedagógico",
    vinculo: "Efetivo",
    jornada: "40 horas semanais",
    dataNascimento: "",
    cpf: "",
    dataAdmissao: textoDaData(new Date()),
    fimContrato: "",
    telefone: "",
    email: "",
    endereco: "",
    senha: "",
    confirmarSenha: "",
    tipoAcesso: "FUNCIONARIO",
  });

  const [erros, setErros] = useState<any>({});
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape" && !carregando) {
        aoFechar();
      }
    }

    window.addEventListener("keydown", aoApertar);

    return () => window.removeEventListener("keydown", aoApertar);
  }, [aoFechar, carregando]);

  function mudar(campo: string, valor: string) {
    setForm((anterior: any) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function gerarMatricula() {
    const matriculas = funcionariosExistentes
      .map((funcionario: any) => String(funcionario.matricula || ""))
      .filter((matricula: string) => /^FUNC\d+$/.test(matricula))
      .map((matricula: string) => Number(matricula.replace("FUNC", "")));

    let numero = matriculas.length > 0
      ? Math.max(...matriculas) + 1
      : proximoId;

    let matricula = `FUNC${String(numero).padStart(4, "0")}`;

    while (
      funcionariosExistentes.some(
        (funcionario: any) => funcionario.matricula === matricula
      )
    ) {
      numero++;
      matricula = `FUNC${String(numero).padStart(4, "0")}`;
    }

    return matricula;
  }

  async function salvar() {
    if (carregando) return;

    const novosErros: any = {};

    novosErros.nome = validarNome(form.nome);
    novosErros.dataNascimento = validarDataNascimento(
      form.dataNascimento,
      18,
      75
    );
    novosErros.cpf = validarCpf(form.cpf);
    novosErros.telefone = validarTelefone(form.telefone);

    if (
      novosErros.telefone === "" &&
      apenasDigitos(form.telefone) === ""
    ) {
      novosErros.telefone = "Informe o telefone.";
    }

    novosErros.email = validarEmail(form.email);

    if (form.endereco.trim().length < 5) {
      novosErros.endereco = "Informe o endereço.";
    }

    novosErros.dataAdmissao = "";

    if (form.dataAdmissao === "") {
      novosErros.dataAdmissao = "Informe a data de admissão.";
    } else if (form.dataAdmissao > textoDaData(new Date())) {
      novosErros.dataAdmissao = "A admissão não pode ser no futuro.";
    }

    novosErros.fimContrato = "";

    if (form.vinculo === "Contratado") {
      if (form.fimContrato === "") {
        novosErros.fimContrato = "Informe quando o contrato termina.";
      } else if (form.fimContrato <= form.dataAdmissao) {
        novosErros.fimContrato =
          "O fim do contrato deve ser depois da admissão.";
      }
    }

    novosErros.senha = "";

    if (form.senha.length < 8) {
      novosErros.senha = "A senha deve ter pelo menos 8 caracteres.";
    }

    novosErros.confirmarSenha = "";

    if (form.confirmarSenha !== form.senha) {
      novosErros.confirmarSenha = "As senhas não coincidem.";
    }

    novosErros.tipoAcesso = "";

    if (
      form.tipoAcesso !== "ADMINISTRADOR" &&
      form.tipoAcesso !== "FUNCIONARIO"
    ) {
      novosErros.tipoAcesso = "Selecione um tipo de acesso válido.";
    }

    if (novosErros.nome === "") {
      for (let i = 0; i < funcionariosExistentes.length; i++) {
        if (
          funcionariosExistentes[i].nome?.toLowerCase() ===
          form.nome.trim().toLowerCase()
        ) {
          novosErros.nome = "Já existe um funcionário com esse nome.";
          break;
        }
      }
    }

    setErros(novosErros);

    const possuiErros = Object.values(novosErros).some(
      (erro: any) => erro !== ""
    );

    if (possuiErros) {
      setErroGeral("Corrija os campos destacados.");
      return;
    }

    setErroGeral("");
    setCarregando(true);

    const funcionario = {
      matricula: gerarMatricula(),
      nome: form.nome.trim(),
      dataNascimento: form.dataNascimento,
      cpf: apenasDigitos(form.cpf),
      status: "ATIVO",
      tipoVinculo: form.vinculo.toUpperCase(),
      cargo: form.cargo,
      setor: form.setor,
      dataAdmissao: form.dataAdmissao,
      jornadaSemanal: Number(form.jornada.split(" ")[0]),
      telefone: apenasDigitos(form.telefone),
      email: form.email.trim(),
      endereco: form.endereco.trim(),
      senha: form.senha,
      tipoAcesso: form.tipoAcesso,
      acessoAtivo: true,
      fotoPerfil: "",
    };

    try {
      await enviarFuncionario(funcionario);

      aoSalvar({
        ...funcionario,
        id: proximoId,
        vinculo: form.vinculo,
        status: "Ativo",
      });
    } catch (erro: any) {
      setErroGeral(
        erro.message || "Não foi possível cadastrar o funcionário."
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
        aria-label="Novo funcionário"
        className="app-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">Novo funcionário</h2>

          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <h3 className="app-report-title mb-2">Dados pessoais</h3>

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
        </div>

        <h3 className="app-report-title mb-2">Vínculo</h3>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario rotulo="Tipo de vínculo">
            <select
              className="app-input w-full"
              value={form.vinculo}
              onChange={(e) => mudar("vinculo", e.target.value)}
            >
              <option>Efetivo</option>
              <option>Contratado</option>
            </select>
          </CampoFormulario>

          <CampoFormulario rotulo="Jornada">
            <select
              className="app-input w-full"
              value={form.jornada}
              onChange={(e) => mudar("jornada", e.target.value)}
            >
              {JORNADAS.map((jornada) => (
                <option key={jornada}>{jornada}</option>
              ))}
            </select>
          </CampoFormulario>

          <CampoFormulario rotulo="Cargo">
            <select
              className="app-input w-full"
              value={form.cargo}
              onChange={(e) => mudar("cargo", e.target.value)}
            >
              {CARGOS.map((cargo) => (
                <option key={cargo}>{cargo}</option>
              ))}
            </select>
          </CampoFormulario>

          <CampoFormulario rotulo="Setor">
            <select
              className="app-input w-full"
              value={form.setor}
              onChange={(e) => mudar("setor", e.target.value)}
            >
              {SETORES.map((setor) => (
                <option key={setor}>{setor}</option>
              ))}
            </select>
          </CampoFormulario>

          <CampoFormulario
            rotulo="Data de admissão"
            erro={erros.dataAdmissao}
          >
            <input
              type="date"
              className="app-input w-full"
              value={form.dataAdmissao}
              onChange={(e) => mudar("dataAdmissao", e.target.value)}
            />
          </CampoFormulario>

          {form.vinculo === "Contratado" && (
            <CampoFormulario
              rotulo="Fim do contrato"
              erro={erros.fimContrato}
            >
              <input
                type="date"
                className="app-input w-full"
                value={form.fimContrato}
                onChange={(e) => mudar("fimContrato", e.target.value)}
              />
            </CampoFormulario>
          )}
        </div>

        <h3 className="app-report-title mb-2">Contato</h3>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario rotulo="Telefone" erro={erros.telefone}>
            <input
              className="app-input w-full"
              placeholder="(35) 99999-9999"
              value={form.telefone}
              onChange={(e) =>
                mudar("telefone", formatarTelefone(e.target.value))
              }
            />
          </CampoFormulario>

          <CampoFormulario rotulo="E-mail" erro={erros.email}>
            <input
              className="app-input w-full"
              value={form.email}
              onChange={(e) => mudar("email", e.target.value)}
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

        <h3 className="app-report-title mb-2">Conta de acesso</h3>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario
            rotulo="Tipo de acesso"
            erro={erros.tipoAcesso}
          >
            <select
              className="app-input w-full"
              value={form.tipoAcesso}
              onChange={(e) => mudar("tipoAcesso", e.target.value)}
            >
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </CampoFormulario>

          <div />

          <CampoFormulario rotulo="Senha" erro={erros.senha}>
            <input
              type="password"
              className="app-input w-full"
              placeholder="Mínimo de 8 caracteres"
              value={form.senha}
              onChange={(e) => mudar("senha", e.target.value)}
              autoComplete="new-password"
            />
          </CampoFormulario>

          <CampoFormulario
            rotulo="Confirmar senha"
            erro={erros.confirmarSenha}
          >
            <input
              type="password"
              className="app-input w-full"
              placeholder="Repita a senha"
              value={form.confirmarSenha}
              onChange={(e) =>
                mudar("confirmarSenha", e.target.value)
              }
              autoComplete="new-password"
            />
          </CampoFormulario>
        </div>

        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          A conta será criada com acesso ativo. A senha será protegida pelo
          backend.
        </div>

        {erroGeral !== "" && (
          <p className="mb-3 text-sm text-red-500">{erroGeral}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            O cadastro será enviado ao servidor EduControl.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={aoFechar}
              disabled={carregando}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={salvar}
              disabled={carregando}
              className="app-button-relatorio disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando ? "Cadastrando..." : "Salvar funcionário"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
