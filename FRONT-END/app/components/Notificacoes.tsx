
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { BellRing, X, Trash2 } from "lucide-react";
import { notificacoesLigadas } from "~/utils/notificacoes";

const API = "http://localhost:8080/edu";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dataHora: string;
  lida: boolean;
  alunoId: number | null;
  rota: string;
};

export function Notificacoes({
  className = "text-gray-900 dark:text-[#f5fffc]",
}: any) {
  const navigate = useNavigate();

  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [ligadas, setLigadas] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [posicao, setPosicao] = useState({
    top: 0,
    direita: 0,
  });

  const botao = useRef<HTMLButtonElement>(null);

  async function carregarNotificacoes() {
    if (!notificacoesLigadas()) {
      setLigadas(false);
      setLista([]);
      setNaoLidas(0);
      return;
    }

    setLigadas(true);
    setCarregando(true);
    setErro("");

    try {
      const [resLista, resContagem] = await Promise.all([
        fetch(`${API}/notificacoes`),
        fetch(`${API}/notificacoes/nao-lidas`),
      ]);

      if (!resLista.ok || !resContagem.ok) {
        throw new Error("Não foi possível carregar as notificações.");
      }

      const dados: Notificacao[] = await resLista.json();
      const contagem = await resContagem.json();

      setLista(dados);
      setNaoLidas(contagem.quantidade);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar notificações."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  function abrir() {
    if (botao.current) {
      const caixa = botao.current.getBoundingClientRect();

      setPosicao({
        top: caixa.bottom + 8,
        direita: window.innerWidth - caixa.right,
      });
    }

    const novoEstado = !aberto;
    setAberto(novoEstado);

    if (novoEstado) {
      carregarNotificacoes();
    }
  }

  useEffect(() => {
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAberto(false);
      }
    }

    if (aberto) {
      window.addEventListener("keydown", aoApertar);
    }

    return () => {
      window.removeEventListener("keydown", aoApertar);
    };
  }, [aberto]);

  async function marcarLida(id: string) {
    try {
      const resposta = await fetch(
        `${API}/notificacoes/${encodeURIComponent(id)}/lida`,
        { method: "PUT" }
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível marcar como lida.");
      }

      setLista((atual) =>
        atual.map((item) =>
          item.id === id ? { ...item, lida: true } : item
        )
      );

      setNaoLidas((atual) => Math.max(0, atual - 1));
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar notificação."
      );
    }
  }

  async function marcarTodas() {
    try {
      const resposta = await fetch(`${API}/notificacoes/lidas`, {
        method: "PUT",
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível atualizar as notificações.");
      }

      setLista((atual) =>
        atual.map((item) => ({ ...item, lida: true }))
      );

      setNaoLidas(0);
      setErro("");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar notificações."
      );
    }
  }

  async function excluirNotificacao(id: string) {
    try {
      const resposta = await fetch(
        `${API}/notificacoes/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível excluir a notificação.");
      }

      const item = lista.find((notificacao) => notificacao.id === id);

      setLista((atual) =>
        atual.filter((notificacao) => notificacao.id !== id)
      );

      if (item && !item.lida) {
        setNaoLidas((atual) => Math.max(0, atual - 1));
      }

      setErro("");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao excluir notificação."
      );
    }
  }

  async function abrirNotificacao(item: Notificacao) {
    if (!item.lida) {
      await marcarLida(item.id);
    }

    setAberto(false);

    if (item.rota) {
      navigate(item.rota);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        ref={botao}
        onClick={abrir}
        title="Notificações"
        aria-label="Notificações"
        aria-expanded={aberto}
        className="relative cursor-pointer"
      >
        <BellRing size={20} className={className} />

        {ligadas && naoLidas > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {naoLidas}
          </span>
        )}
      </button>

      {aberto &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setAberto(false)}
            />

            <div
              role="dialog"
              aria-label="Notificações"
              className="fixed z-[100] w-80 max-w-[calc(100vw-1rem)] rounded-lg border border-slate-200 bg-white p-4 text-sm text-gray-900 shadow-xl dark:border-white/10 dark:bg-[#0a141a] dark:text-[#f5fffc]"
              style={{
                top: posicao.top,
                right: posicao.direita,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="app-report-title">Notificações</h2>

                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className="cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {!ligadas && (
                <p className="py-4 text-center text-gray-500">
                  As notificações do sistema estão desativadas em Configurações.
                </p>
              )}

              {ligadas && carregando && (
                <p className="py-4 text-center text-gray-500">
                  Carregando notificações...
                </p>
              )}

              {ligadas && erro && (
                <p className="py-3 text-center text-red-500">
                  {erro}
                </p>
              )}

              {ligadas && !carregando && !erro && lista.length === 0 && (
                <p className="py-4 text-center text-gray-500">
                  Nenhuma notificação por enquanto.
                </p>
              )}

              {ligadas && lista.length > 0 && (
                <>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {lista.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10"
                      >
                        <button
                          type="button"
                          onClick={() => abrirNotificacao(item)}
                          className="min-w-0 flex-1 cursor-pointer text-left"
                        >
                          <span className="flex items-center gap-2 font-semibold">
                            {!item.lida && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                            )}

                            {item.titulo}
                          </span>

                          <span className="mt-1 block text-xs text-gray-500">
                            {item.mensagem}
                          </span>

                          <span className="mt-1 block text-[10px] text-gray-400">
                            {new Date(item.dataHora).toLocaleString("pt-BR")}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirNotificacao(item.id)}
                          title="Excluir notificação"
                          aria-label="Excluir notificação"
                          className="shrink-0 cursor-pointer text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {naoLidas > 0 && (
                    <button
                      type="button"
                      onClick={marcarTodas}
                      className="mt-3 w-full cursor-pointer text-center text-xs font-semibold text-[#22c7a9]"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
