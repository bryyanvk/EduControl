const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

interface RespostaIA {
  resposta: string;
}

export async function enviarParaIA(pergunta: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/ia/perguntar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pergunta }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || `Erro na API: ${response.status}`);
  }

  const dados: RespostaIA = await response.json();

  if (!dados.resposta) {
    throw new Error("O backend não retornou uma resposta válida.");
  }

  return dados.resposta;
}