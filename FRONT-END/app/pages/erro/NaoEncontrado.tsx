import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Home, Search } from "lucide-react";
import { TelaVidro } from "~/pages/erro/TelaVidro";
import { pegarUsuario } from "~/auth/sessao";

// Página 404 (rota "*" e ErrorBoundary do root). Funciona logado ou não:
// logado, volta para /home; sem sessão, volta para o login.
export function NaoEncontrado() {
  const navegar = useNavigate();
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    setLogado(pegarUsuario() !== null);
  }, []);

  const inicio = logado ? "/home" : "/";

  return (
    <TelaVidro inicio={inicio}>
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        {/* documento triste com selo de exclamação */}
        <svg viewBox="0 0 220 200" className="mb-2 h-36 w-40 sm:h-44 sm:w-48" aria-hidden="true">
          <defs>
            <linearGradient id="doc404" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2a4a63" />
              <stop offset="1" stopColor="#10283b" />
            </linearGradient>
          </defs>
          <path d="M40 20h90l45 45v100a12 12 0 0 1-12 12H52a12 12 0 0 1-12-12V32a12 12 0 0 1 12-12Z" fill="url(#doc404)" stroke="#5fd4f0" strokeOpacity=".45" strokeWidth="2" transform="rotate(-6 110 100)" />
          <path d="M130 20v35a10 10 0 0 0 10 10h35Z" fill="#3b7f9c" opacity=".7" transform="rotate(-6 110 100)" />
          <g stroke="#dbe7f3" strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M78 85v14M112 83v14" />
            <path d="M80 130c10-12 28-12 38 0" />
          </g>
          <circle cx="170" cy="140" r="28" fill="#12c4e6" />
          <path d="M170 124v18" stroke="#06202c" strokeWidth="7" strokeLinecap="round" />
          <circle cx="170" cy="153" r="4" fill="#06202c" />
          <g stroke="#22d3ee" strokeWidth="6" strokeLinecap="round">
            <path d="M22 50l16 12M10 85h18" />
          </g>
        </svg>

        <h1 className="text-7xl font-black tracking-tight sm:text-8xl">404</h1>
        <h2 className="mt-1 text-3xl font-bold sm:text-4xl">
          Página <span className="text-cyan-400">não</span> encontrada
        </h2>
        <p className="mt-4 max-w-md text-base text-slate-300 sm:text-lg">
          A página que você tentou acessar não existe ou foi removida.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={inicio}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-7 py-3 font-semibold text-[#03131d] shadow-[0_0_24px_rgba(34,211,238,.45)] transition hover:brightness-110"
          >
            <Home size={20} /> Voltar para o Início
          </Link>
          <button
            type="button"
            onClick={() => navegar(logado ? "/home?pesquisar=1" : "/")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/40 px-7 py-3 font-medium text-white transition hover:bg-white/10"
          >
            <Search size={20} /> Pesquisar
          </button>
        </div>
      </section>
    </TelaVidro>
  );
}
