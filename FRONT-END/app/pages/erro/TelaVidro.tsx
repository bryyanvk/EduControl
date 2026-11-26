import type { ReactNode } from "react";
import { Link } from "react-router";
import { GraduationCap, Home } from "lucide-react";

// Layout glassmorphism compartilhado pelas páginas 404 e "Em construção".
export function TelaVidro({ inicio, children }: { inicio: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#020b14] text-white">
      {/* fundo: gradientes e formas de vidro */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#0b4a63_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,#073a52_0%,transparent_50%)]" />
      <div className="pointer-events-none absolute -left-24 -top-10 h-56 w-[28rem] -skew-x-[28deg] rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-transparent backdrop-blur-sm" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-60 w-[26rem] -skew-x-[28deg] rounded-3xl border border-cyan-400/10 bg-gradient-to-tr from-cyan-400/10 to-transparent" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-60 w-[24rem] skew-x-[28deg] rounded-3xl border border-cyan-400/20 bg-gradient-to-tl from-cyan-400/20 to-transparent backdrop-blur-sm" />

      {/* capelo de formatura semitransparente */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 300"
        className="pointer-events-none absolute right-[-6%] top-[12%] hidden w-[46%] max-w-[760px] text-[#0b6f8f] opacity-40 md:block"
        fill="currentColor"
      >
        <path d="M200 20 400 100 200 180 0 100Z" />
        <path d="M80 140v60c0 28 55 50 120 50s120-22 120-50v-60l-120 48Z" opacity=".75" />
        <path d="M350 112h10v110c0 8-10 8-10 0Z" />
        <circle cx="355" cy="236" r="12" />
        <path d="M345 245h20l4 40h-28Z" />
      </svg>

      <header className="relative z-10 flex items-center justify-between border-b border-cyan-400/10 px-5 py-4 sm:px-10">
        <Link to={inicio} className="flex items-center gap-3">
          <GraduationCap className="h-9 w-9 text-cyan-400" />
          <span className="leading-tight">
            <span className="block text-xl font-bold">
              Edu<span className="text-cyan-400">Control</span>
            </span>
            <span className="block text-xs text-slate-300">Gestão escolar</span>
          </span>
        </Link>
        <Link
          to={inicio}
          aria-label="Ir para o início"
          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-300 transition hover:bg-cyan-400/20"
        >
          <Home size={20} />
        </Link>
      </header>

      {children}
    </main>
  );
}
