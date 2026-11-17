import { useEffect } from "react";

export function ConfirmarExclusao({ titulo, mensagem, aoConfirmar, aoCancelar }: any) {
  useEffect(() => {
    function aoApertar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        aoCancelar();
      }
    }
    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={aoCancelar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="app-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-xl font-bold">{titulo}</h2>
        <p className="mb-5 text-sm">{mensagem}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoCancelar} className="cursor-pointer rounded-lg px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
