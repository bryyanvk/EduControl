import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CampoFormulario } from "~/components/CampoFormulario";
import { enviarTurma, editarTurma } from "~/services/api";

export function NovaTurma({ aoFechar, aoSalvar, turmasExistentes, proximoId, turmaEditando }: any) {
  let formInicial = {
    nome: "",
    curso: "",
  };
  if (turmaEditando) {
    formInicial = {
      nome: turmaEditando.nome,
      curso: turmaEditando.curso,
    };
  }
  const [form, setForm] = useState(formInicial);
  const [erros, setErros] = useState<any>({});
  const [salvando, setSalvando] = useState(false);

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
    const nome = form.nome.trim();
    const curso = form.curso.trim();

    if (nome === "") {
      novosErros.nome = "Informe o nome da turma.";
    } else if (nome.length > 30) {
      novosErros.nome = "O nome deve ter no máximo 30 caracteres.";
    } else {
      for (let i = 0; i < turmasExistentes.length; i++) {
        const ehAMesma = turmaEditando && turmasExistentes[i].id === turmaEditando.id;
        if (ehAMesma === false && turmasExistentes[i].nome.toLowerCase() === nome.toLowerCase()) {
          novosErros.nome = "Já existe uma turma com esse nome.";
        }
      }
    }

    if (curso === "") {
      novosErros.curso = "Informe o curso.";
    } else if (curso.length > 40) {
      novosErros.curso = "O curso deve ter no máximo 40 caracteres.";
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }

    let turma: any = { id: proximoId, nome: nome, curso: curso };
    if (turmaEditando) {
      turma = { id: turmaEditando.id, nome: nome, curso: curso };
    }

    setSalvando(true);
    let envio = enviarTurma(turma);
    if (turmaEditando) {
      envio = editarTurma(turma.id, turma);
    }
    envio
      .then(() => {
        setSalvando(false);
        if (turmaEditando) {
          aoSalvar({ id: turma.id, nome: nome, curso: curso, editou: true, nomeAntigo: turmaEditando.nome });
        } else {
          aoSalvar({ id: turma.id, nome: nome, curso: curso, editou: false, nomeAntigo: nome });
        }
      })
      .catch(() => {
        setSalvando(false);
        setErros({ nome: "Não foi possível salvar. O back está rodando?" });
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
        aria-label={turmaEditando ? "Editar turma" : "Nova turma"}
        className="app-card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{turmaEditando ? "Editar turma" : "Nova turma"}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario rotulo="Nome da turma" erro={erros.nome}>
            <input
              className="app-input w-full"
              placeholder="9º Ano C"
              value={form.nome}
              onChange={(e) => mudar("nome", e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="Curso" erro={erros.curso}>
            <input
              className="app-input w-full"
              placeholder="Ensino Fundamental"
              value={form.curso}
              onChange={(e) => mudar("curso", e.target.value)}
            />
          </CampoFormulario>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">Salvo no back-end.</p>
          <div className="flex gap-2">
            <button type="button" onClick={aoFechar} className="cursor-pointer rounded-lg px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="button" onClick={salvar} disabled={salvando} className="app-button-relatorio">
              {salvando ? "Salvando..." : turmaEditando ? "Salvar alterações" : "Salvar turma"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
