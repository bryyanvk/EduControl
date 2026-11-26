import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { CHAVE_COOKIES, limparArmazenamentoNaoEssencial } from "~/utils/cookies";

const CHAVE = CHAVE_COOKIES;
const EVENTO_ABRIR = "educontrol-abrir-cookies";

type Preferencia = { essenciais: true; analiticos: boolean; decididoEm: string };

export function lerPreferenciaCookies(): Preferencia | null {
  try {
    const texto = localStorage.getItem(CHAVE);
    if (texto) {
      return JSON.parse(texto);
    }
  } catch {
    return null;
  }
  return null;
}

export function abrirPreferenciasCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

export function ConsentimentoCookies() {
  const [aberto, setAberto] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [analiticos, setAnaliticos] = useState(false);
  const [detalhes, setDetalhes] = useState(false);

  useEffect(() => {
    const salva = lerPreferenciaCookies();
    if (salva === null) {
      setAberto(true);
    } else {
      setAnaliticos(salva.analiticos);
    }
    setPronto(true);

    const abrir = () => {
      const atual = lerPreferenciaCookies();
      setAnaliticos(atual ? atual.analiticos : false);
      setDetalhes(true);
      setAberto(true);
    };
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  function salvar(aceitaAnaliticos: boolean) {
    const preferencia: Preferencia = {
      essenciais: true,
      analiticos: aceitaAnaliticos,
      decididoEm: new Date().toISOString(),
    };
    try {
      localStorage.setItem(CHAVE, JSON.stringify(preferencia));
    } catch {
      // sem armazenamento: a escolha vale apenas até recarregar a página
    }
    if (aceitaAnaliticos === false) {
      limparArmazenamentoNaoEssencial();
    }
    setAnaliticos(aceitaAnaliticos);
    setAberto(false);
    setDetalhes(false);
  }

  if (pronto === false) {
    return null;
  }

  if (aberto === false) {
    return (
      <button
        type="button"
        onClick={abrirPreferenciasCookies}
        aria-label="Preferências de cookies"
        title="Preferências de cookies"
        className="fixed bottom-3 left-3 z-40 rounded-full bg-[#0d4c5c] p-2 text-white shadow-lg ring-1 ring-white/20 transition hover:scale-105 dark:bg-[#0c171d]"
      >
        <Cookie size={16} />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-800 shadow-2xl dark:border-white/10 dark:bg-[#071015] dark:text-[#edf7f4]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <Cookie size={18} className="text-[#0d4c5c] dark:text-[#45dbc2]" />
          Privacidade e cookies
        </div>
        {lerPreferenciaCookies() !== null && (
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              setDetalhes(false);
            }}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <p className="mt-2 text-gray-600 dark:text-[#8fb1aa]">
        O EduControl usa cookies e armazenamento local estritamente necessários
        para manter sua sessão e suas configurações. Cookies não essenciais
        (estatísticas de uso) só são usados com o seu consentimento, conforme a
        LGPD (Lei nº 13.709/2018). Você pode mudar a escolha a qualquer momento
        pelo ícone de cookies no canto da tela.
      </p>

      {detalhes && (
        <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-[#0c171d]">
          <label className="flex items-center justify-between gap-3">
            <span>
              <strong>Essenciais</strong> — login, sessão e preferências do sistema.
            </span>
            <input type="checkbox" checked disabled />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>
              <strong>Não essenciais</strong> — lembretes e preferências locais (notificações lidas, edições de contato, última leitura RFID) e estatísticas de uso.
            </span>
            <input
              type="checkbox"
              checked={analiticos}
              onChange={(e) => setAnaliticos(e.target.checked)}
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {detalhes === false ? (
          <button
            type="button"
            onClick={() => setDetalhes(true)}
            className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-[#8fb1aa] dark:hover:bg-white/5"
          >
            Personalizar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => salvar(analiticos)}
            className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-[#8fb1aa] dark:hover:bg-white/5"
          >
            Salvar escolha
          </button>
        )}
        <button
          type="button"
          onClick={() => salvar(false)}
          className="rounded-lg border border-gray-300 px-3 py-2 font-medium hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Rejeitar não essenciais
        </button>
        <button
          type="button"
          onClick={() => salvar(true)}
          className="rounded-lg bg-[#0d4c5c] px-3 py-2 font-medium text-white hover:bg-[#0b3f4d]"
        >
          Aceitar todos
        </button>
      </div>
    </div>
  );
}
