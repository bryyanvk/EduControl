import { requisitar, textoDoErro } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export type AcaoIA = {
  id: string;
  tipo: "ALTERAR_APARENCIA" | "ALTERAR_NOTIFICACAO" | string;
  descricao: string;
  parametros: Record<string, any>;
  expiraEm?: string;
};

export type RespostaIA = {
  resposta: string;
  acaoPendente?: AcaoIA | null;
  acaoExecutada?: AcaoIA | null;
};

async function lerResposta(response: Response): Promise<RespostaIA> {
  if (!response.ok) {
    const erro = await response.text();
    const mensagens: Record<number, string> = {
      401: "Sessão expirada. Entre novamente.",
      403: "Seu perfil não tem permissão para essa ação.",
      404: "Ação não encontrada, já utilizada ou expirada. Peça de novo.",
      503: "A IA está indisponível no momento.",
    };
    throw new Error(erro || mensagens[response.status] || `Erro na API: ${response.status}`);
  }

  const dados: RespostaIA = await response.json();

  if (!dados.resposta) {
    throw new Error("O backend não retornou uma resposta válida.");
  }

  return dados;
}

export async function perguntarIA(pergunta: string): Promise<RespostaIA> {
  const response = await requisitar(`${API_URL}/api/ia/perguntar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pergunta }),
  });

  return lerResposta(response);
}

// Mantida por compatibilidade: devolve só o texto.
export async function enviarParaIA(pergunta: string): Promise<string> {
  return (await perguntarIA(pergunta)).resposta;
}

export async function confirmarAcaoIA(id: string): Promise<RespostaIA> {
  return lerResposta(
    await requisitar(`${API_URL}/api/ia/acoes/${encodeURIComponent(id)}/confirmar`, { method: "POST" }),
  );
}

export async function cancelarAcaoIA(id: string): Promise<RespostaIA> {
  return lerResposta(
    await requisitar(`${API_URL}/api/ia/acoes/${encodeURIComponent(id)}/cancelar`, { method: "POST" }),
  );
}

// Depois de uma ação executada: aplica o tema na hora e recarrega o sino de notificações.
export function aplicarAcaoExecutada(acao: AcaoIA | null | undefined) {
  if (!acao) {
    return;
  }
  if (acao.tipo === "ALTERAR_APARENCIA" && acao.parametros?.aparencia) {
    window.dispatchEvent(
      new CustomEvent("educontrol-tema-alterado", { detail: acao.parametros.aparencia }),
    );
  }
  window.dispatchEvent(new Event("educontrol-notificacoes-atualizar"));
}

export { textoDoErro };
