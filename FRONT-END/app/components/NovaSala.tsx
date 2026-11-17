import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CampoFormulario } from "~/components/CampoFormulario";
import { enviarSala, editarSala } from "~/services/api";
import { statusParaBack, turmaPeloNome } from "~/utils/conversaoBack";

export function NovaSala({ aoFechar, aoSalvar, salasExistentes, turmas, salaEditando }: any) {
  let formInicial = {
    numero: "",
    capacidade: "",
    andar: "Térreo",
    turma: "Sem turma",
    status: "Disponível",
  };
  if (salaEditando) {
    formInicial = {
      numero: String(salaEditando.numero),
      capacidade: salaEditando.capacidade,
      andar: salaEditando.andar,
      turma: salaEditando.turma,
      status: salaEditando.cor,
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

    const numero = parseInt(form.numero, 10);
    if (!salaEditando) {
      if (isNaN(numero) || String(numero) !== form.numero.trim()) {
        novosErros.numero = "Informe o número da sala com números inteiros.";
      } else if (numero < 1 || numero > 999) {
        novosErros.numero = "O número deve ficar entre 1 e 999.";
      } else {
        for (let i = 0; i < salasExistentes.length; i++) {
          if (salasExistentes[i].numero === numero) {
            novosErros.numero = "Já existe a Sala " + numero + ".";
          }
        }
      }
    }

    const capacidade = parseInt(form.capacidade, 10);
    if (isNaN(capacidade) || String(capacidade) !== form.capacidade.trim()) {
      novosErros.capacidade = "Informe a capacidade com números inteiros.";
    } else if (capacidade < 1 || capacidade > 100) {
      novosErros.capacidade = "A capacidade deve ficar entre 1 e 100.";
    }

    if (form.turma !== "Sem turma") {
      for (let i = 0; i < salasExistentes.length; i++) {
        if (salasExistentes[i].turma === form.turma && salasExistentes[i].numero !== numero) {
          novosErros.turma = "Essa turma já está em " + salasExistentes[i].nome + ".";
        }
      }
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }

    const salaParaEnviar = {
      numero: numero,
      capacidade: capacidade,
      andar: form.andar,
      status: statusParaBack(form.status),
      turma: turmaPeloNome(form.turma, turmas),
    };

    setSalvando(true);
    let envio = enviarSala(salaParaEnviar);
    if (salaEditando) {
      envio = editarSala(numero, salaParaEnviar);
    }
    envio
      .then(() => {
        setSalvando(false);
        aoSalvar({ nome: "Sala " + numero, editou: salaEditando ? true : false });
      })
      .catch(() => {
        setSalvando(false);
        setErros({ numero: "Não foi possível salvar. O back está rodando?" });
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
        aria-label={salaEditando ? "Editar sala" : "Nova sala"}
        className="app-card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{salaEditando ? "Editar sala" : "Nova sala"}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CampoFormulario rotulo="Número da sala" erro={erros.numero}>
            <input
              className="app-input w-full"
              inputMode="numeric"
              placeholder="5"
              disabled={salaEditando ? true : false}
              value={form.numero}
              onChange={(e) => mudar("numero", e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="Capacidade (alunos)" erro={erros.capacidade}>
            <input
              className="app-input w-full"
              inputMode="numeric"
              value={form.capacidade}
              onChange={(e) => mudar("capacidade", e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario rotulo="Andar">
            <select className="app-input w-full" value={form.andar} onChange={(e) => mudar("andar", e.target.value)}>
              <option>Térreo</option>
              <option>1º Andar</option>
              <option>2º Andar</option>
            </select>
          </CampoFormulario>
          <CampoFormulario rotulo="Turma" erro={erros.turma}>
            <select className="app-input w-full" value={form.turma} onChange={(e) => mudar("turma", e.target.value)}>
              <option>Sem turma</option>
              {turmas.map((turma: any) => (
                <option key={turma.id}>{turma.nome}</option>
              ))}
            </select>
          </CampoFormulario>
          <CampoFormulario rotulo="Status">
            <select className="app-input w-full" value={form.status} onChange={(e) => mudar("status", e.target.value)}>
              <option>Disponível</option>
              <option>Em uso</option>
              <option>Em manutenção</option>
            </select>
          </CampoFormulario>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">Salvo no back-end.</p>
          <div className="flex gap-2">
            <button type="button" onClick={aoFechar} className="cursor-pointer rounded-lg px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="button" onClick={salvar} disabled={salvando} className="app-button-relatorio">
              {salvando ? "Salvando..." : salaEditando ? "Salvar alterações" : "Salvar sala"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
