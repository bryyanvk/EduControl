import { EmConstrucao } from "~/pages/erro/EmConstrucao";
import type { Route } from "./+types/emConstrucao";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Educontrol - Em construção" }];
}

export default function PaginaEmConstrucao() {
  return <EmConstrucao />;
}
