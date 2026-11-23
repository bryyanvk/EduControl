
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { useEffect } from "react";
import type { Route } from "./+types/root";
import { buscarConfiguracaoGeral } from "./services/api";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useEffect(() => {
    let ativo = true;
    let removerListener = () => {};

    function aplicarTema(preferencia: string) {
      removerListener();
      removerListener = () => {};

      const tema = (preferencia || "auto").toLowerCase().trim();

      const automatico = ["auto", "automático", "automatico"].includes(tema);
      const escuro = ["escuro", "dark"].includes(tema);

      if (automatico) {
        const sistema = window.matchMedia("(prefers-color-scheme: dark)");

        const atualizarTema = () => {
          document.documentElement.classList.toggle("dark", sistema.matches);
          document.documentElement.style.colorScheme = sistema.matches
            ? "dark"
            : "light";
        };

        atualizarTema();
        sistema.addEventListener("change", atualizarTema);

        removerListener = () => {
          sistema.removeEventListener("change", atualizarTema);
        };

        return;
      }

      document.documentElement.classList.toggle("dark", escuro);
      document.documentElement.style.colorScheme = escuro ? "dark" : "light";
    }

    const receberTema = (evento: Event) => {
      const customizado = evento as CustomEvent<string>;
      aplicarTema(customizado.detail ?? "auto");
    };

    window.addEventListener("educontrol-tema-alterado", receberTema);

    buscarConfiguracaoGeral()
      .then((config) => {
        if (ativo) {
          aplicarTema(config.aparencia ?? "auto");
        }
      })
      .catch(() => {
        if (ativo) {
          aplicarTema("auto");
        }
      });

    return () => {
      ativo = false;
      removerListener();
      window.removeEventListener("educontrol-tema-alterado", receberTema);
    };
  }, []);

  return <Outlet />;
}
