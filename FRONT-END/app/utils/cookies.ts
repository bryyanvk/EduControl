// Consentimento de cookies/armazenamento (LGPD).
// Essenciais (sempre ativos): sessão de login (sessionStorage), escolha de cookies,
// estado do leitor RFID e registros de presença do dia.
// Não essenciais (só com consentimento): preferências e lembretes locais listados abaixo.

export const CHAVE_COOKIES = "educontrol:cookies";

export type CategoriaCookie = "preferencias";

// Itens de localStorage que dependem do consentimento.
const CHAVES_NAO_ESSENCIAIS = [
  "educontrol:notificacoes-lidas",
  "educontrol:alunos-contato",
  "educontrol:funcionarios-contato",
  "educontrol:rfid-ultima",
  "educontrol-configuracoes",
];

export function lerConsentimento(): { analiticos: boolean } | null {
  try {
    const texto = localStorage.getItem(CHAVE_COOKIES);
    if (texto) {
      return JSON.parse(texto);
    }
  } catch {
    return null;
  }
  return null;
}

export function podeUsarCookies(_categoria: CategoriaCookie = "preferencias"): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const consentimento = lerConsentimento();
  return consentimento !== null && consentimento.analiticos === true;
}

export function limparArmazenamentoNaoEssencial() {
  try {
    for (const chave of CHAVES_NAO_ESSENCIAIS) {
      localStorage.removeItem(chave);
    }
  } catch {
    // sem armazenamento disponível
  }
}

// Grava no localStorage só se o usuário aceitou os cookies não essenciais.
export function gravarNaoEssencial(chave: string, valor: string) {
  if (podeUsarCookies("preferencias") === false) {
    return false;
  }
  try {
    localStorage.setItem(chave, valor);
    return true;
  } catch {
    return false;
  }
}
