import { Link } from "react-router";
import { ArrowLeft, Hammer } from "lucide-react";
import { TelaVidro } from "~/pages/erro/TelaVidro";

// Destino do botão "Entrar com o Google" (OAuth ainda não implementado).
export function EmConstrucao() {
  return (
    <TelaVidro inicio="/">
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-[#2a4a63] to-[#10283b] text-cyan-300 shadow-[0_0_32px_rgba(34,211,238,.3)]">
          <Hammer size={44} />
        </div>
        <h1 className="text-4xl font-bold sm:text-5xl">
          Página em <span className="text-cyan-400">construção</span>
        </h1>
        <p className="mt-4 max-w-md text-base text-slate-300 sm:text-lg">
          Estamos trabalhando nisso. O login com o Google ainda não está disponível.
          Por enquanto, entre com seu e-mail ou matrícula.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-7 py-3 font-semibold text-[#03131d] shadow-[0_0_24px_rgba(34,211,238,.45)] transition hover:brightness-110"
        >
          <ArrowLeft size={20} /> Voltar para o login
        </Link>
      </section>
    </TelaVidro>
  );
}
