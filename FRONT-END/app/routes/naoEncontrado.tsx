import { NaoEncontrado } from "~/pages/erro/NaoEncontrado";
import type { Route } from "./+types/naoEncontrado";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Educontrol - Página não encontrada" }];
}

export default function PaginaNaoEncontrada() {
  return <NaoEncontrado />;
}
