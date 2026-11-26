// Foto padrão (iniciais do usuário) usada enquanto a conta não tem foto cadastrada.
export function fotoOuPadrao(foto: string | null | undefined, nome: string | null | undefined) {
  if (foto) {
    return foto;
  }

  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  let iniciais = "?";
  if (partes.length > 0) {
    iniciais = partes[0][0];
    if (partes.length > 1) {
      iniciais += partes[partes.length - 1][0];
    }
  }

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' +
    '<rect width="128" height="128" fill="#0d4c5c"/>' +
    '<text x="64" y="64" fill="#ffffff" font-family="Arial, sans-serif" font-size="52" ' +
    'font-weight="700" text-anchor="middle" dominant-baseline="central">' +
    iniciais.toUpperCase().replace(/[<>&]/g, "") +
    "</text></svg>";

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Reduz a imagem escolhida (lado máximo 256 px, JPEG) para ficar leve ao salvar no back-end.
export function reduzirImagem(arquivo: File, lado = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      imagem.onload = () => {
        const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imagem.width * escala);
        canvas.height = Math.round(imagem.height * escala);
        const ctx = canvas.getContext("2d");
        if (ctx === null) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      imagem.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}
