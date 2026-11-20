
import { useEffect, useState } from "react";
import { X, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  montarCsv,
  linhasDeFrequencia,
  linhasDeAlunos,
  nomeDoArquivo,
  baixarCsv,
} from "~/utils/exportarCsv";

export function GerarRelatorio({
  aoFechar,
  aoGerar,
  tipo,
  periodo,
  turma,
  registros,
  alunos,
}: any) {
  let inicial = "frequencia";

  if (tipo === "Alunos") {
    inicial = "alunos";
  }

  const [conteudo, setConteudo] = useState(inicial);

  useEffect(() => {
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        aoFechar();
      }
    }

    window.addEventListener("keydown", aoApertar);

    return () => {
      window.removeEventListener("keydown", aoApertar);
    };
  }, [aoFechar]);

  let quantidade = registros.length;

  if (conteudo === "alunos") {
    quantidade = alunos.length;
  }

  function obterDados() {
    if (conteudo === "alunos") {
      return {
        cabecalhos: ["Aluno", "Turma", "Presença", "Média", "Situação"],
        linhas: linhasDeAlunos(alunos),
        titulo: "Relatório de Alunos",
      };
    }

    return {
      cabecalhos: ["Data", "Aluno", "Turma", "Status", "Entrada"],
      linhas: linhasDeFrequencia(registros),
      titulo: "Relatório de Frequência",
    };
  }

  function baixar() {
    if (quantidade === 0) return;

    const dados = obterDados();

    const texto = montarCsv(
      dados.cabecalhos,
      dados.linhas
    );

    const nome = nomeDoArquivo(conteudo);

    baixarCsv(nome, texto);

    aoGerar(nome, quantidade);
  }

  function baixarPdf() {
    if (quantidade === 0) return;

    const dados = obterDados();

    const orientacao =
      conteudo === "frequencia" ? "landscape" : "portrait";

    const documento = new jsPDF({
      orientation: orientacao,
      unit: "mm",
      format: "a4",
    });

    const largura = documento.internal.pageSize.getWidth();

    documento.setFont("helvetica", "bold");
    documento.setFontSize(18);
    documento.text("EduControl", 14, 18);

    documento.setFont("helvetica", "normal");
    documento.setFontSize(10);
    documento.text("Secretaria Inteligente", 14, 24);

    documento.setFont("helvetica", "bold");
    documento.setFontSize(15);
    documento.text(dados.titulo, 14, 36);

    documento.setFont("helvetica", "normal");
    documento.setFontSize(10);

    let posicao = 44;

    if (conteudo === "frequencia") {
      documento.text(`Periodo: ${periodo}`, 14, posicao);
      posicao += 6;
    }

    documento.text(`Turma: ${turma}`, 14, posicao);
    posicao += 6;

    documento.text(
      `Total de registros: ${quantidade}`,
      14,
      posicao
    );

    documento.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
      largura - 14,
      18,
      { align: "right" }
    );

    autoTable(documento, {
      startY: posicao + 8,
      head: [dados.cabecalhos],
      body: dados.linhas,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [13, 76, 92],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 248, 250],
      },
      margin: {
        left: 14,
        right: 14,
        bottom: 18,
      },
      didDrawPage: () => {
        const altura = documento.internal.pageSize.getHeight();

        documento.setFontSize(8);
        documento.setFont("helvetica", "normal");

        documento.text(
          "EduControl - Secretaria Inteligente",
          14,
          altura - 8
        );

        documento.text(
          `Pagina ${documento.getNumberOfPages()}`,
          largura - 14,
          altura - 8,
          { align: "right" }
        );
      },
    });

    const nome = nomeDoArquivo(conteudo).replace(
      /\.csv$/i,
      ".pdf"
    );

    documento.save(nome);

    aoGerar(nome, quantidade);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Gerar relatório"
        className="app-card w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              Gerar relatório
            </h2>

            <p className="app-muted text-sm">
              Exporte seus dados em CSV ou PDF.
            </p>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 space-y-2 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="conteudo"
              checked={conteudo === "frequencia"}
              onChange={() => setConteudo("frequencia")}
            />
            Frequência (um registro por aluno e dia)
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="conteudo"
              checked={conteudo === "alunos"}
              onChange={() => setConteudo("alunos")}
            />
            Alunos (presença, média e situação)
          </label>
        </div>

        <div className="mb-4 rounded-lg border border-slate-200 p-3 text-sm dark:border-white/10">
          {conteudo === "frequencia" && (
            <p>Período: {periodo}</p>
          )}

          <p>Turma: {turma}</p>

          <p className="font-semibold">
            {quantidade}{" "}
            {quantidade === 1 ? "linha" : "linhas"} no arquivo
          </p>

          {quantidade === 0 && (
            <p className="mt-1 text-red-500">
              Não há dados com esses filtros.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={baixar}
            disabled={quantidade === 0}
            className="app-button-relatorio disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            CSV
          </button>

          <button
            type="button"
            onClick={baixarPdf}
            disabled={quantidade === 0}
            className="app-button-relatorio disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText size={16} />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}
