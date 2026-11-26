
import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

import { API, requisitar } from "~/services/api";

type LeitorRfidProps = {
  podeAlterar: boolean;
};

export function LeitorRfid({ podeAlterar }: LeitorRfidProps) {
  const [ativo, setAtivo] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [alterando, setAlterando] = useState(false);
  const [erro, setErro] = useState("");

  async function consultarEstado() {
    try {
      setErro("");

      const resposta = await requisitar(`${API}/rfid/estado`);

      if (resposta.status === 403) {
        throw new Error("Seu perfil não tem permissão para consultar o leitor RFID.");
      }

      if (!resposta.ok) {
        throw new Error("Não foi possível consultar o estado do RFID.");
      }

      const estado: boolean = await resposta.json();

      setAtivo(estado);
    } catch (erro: any) {
      setErro(
        erro instanceof TypeError
          ? "Não foi possível consultar o RFID. Verifique o backend."
          : erro.message || "Não foi possível consultar o RFID."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    consultarEstado();
  }, []);

  async function alternar() {
    const novoEstado = !ativo;

    try {
      setAlterando(true);
      setErro("");

      const resposta = await requisitar(
        `${API}/rfid/estado?ativo=${novoEstado}`,
        {
          method: "PUT",
        },
      );

      if (resposta.status === 403) {
        throw new Error("Somente o administrador pode ativar ou desativar o leitor RFID.");
      }

      if (!resposta.ok) {
        throw new Error("Não foi possível alterar o estado do RFID.");
      }

      await resposta.text();
      setAtivo(novoEstado);
    } catch (erro: any) {
      setErro(
        erro instanceof TypeError
          ? "Não foi possível alterar o RFID. Tente novamente."
          : erro.message || "Não foi possível alterar o RFID."
      );
    } finally {
      setAlterando(false);
    }
  }

  return (
    <div className="app-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Radio
            size={22}
            className={
              ativo
                ? "text-emerald-500"
                : "text-gray-400"
            }
          />

          <div>
            <p className="font-semibold">Leitor RFID</p>

            <p className="flex items-center gap-2 text-sm">
              <span
                className={
                  "h-2.5 w-2.5 rounded-full " +
                  (ativo ? "bg-emerald-500" : "bg-red-500")
                }
              />

              {carregando
                ? "Consultando..."
                : ativo
                  ? "Ativo"
                  : "Inativo"}
            </p>
          </div>
        </div>

        {podeAlterar && (
          <button
            type="button"
            onClick={alternar}
            disabled={carregando || alterando || erro !== ""}
            className="cursor-pointer text-sm font-semibold text-[#22c7a9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {alterando
              ? "Alterando..."
              : ativo
                ? "Desativar leitor"
                : "Ativar leitor"}
          </button>
        )}
      </div>

      {erro !== "" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-red-500">
          <span>{erro}</span>

          <button
            type="button"
            onClick={consultarEstado}
            disabled={carregando}
            className="font-semibold underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500 dark:text-[#8fb1aa]">
        {ativo
          ? "O sistema permite novos registros de presença por RFID."
          : "Novos registros de presença por RFID estão bloqueados."}
      </p>
    </div>
  );
}
