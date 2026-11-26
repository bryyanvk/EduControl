
import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Briefcase,
  CalendarDays,
  ShieldCheck,
  Clock,
  Lock,
  Save,
  Camera,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { Notificacoes } from "~/components/Notificacoes";
import { Sidebar } from "~/components/Sidebar";
import { useUsuario } from "~/hooks/useUsuario";
import { nomeDoPerfil } from "~/auth/permissoes";
import {
  formatarDataCurta,
  formatarDataLonga,
  formatarUltimoAcesso,
} from "~/utils/formatacao";
import {
  formatarTelefone,
  validarEmail,
  validarNome,
  validarNovaSenha,
  validarTelefone,
} from "~/utils/validacoes";
import {
  buscarPerfil,
  atualizarPerfil,
  registrarUltimoAcesso,
} from "~/services/api";

import { fotoOuPadrao, reduzirImagem } from "~/utils/fotoPerfil";

const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024;

const CLASSE_CAMPO =
  "w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#0d7f70] dark:border-white/15 dark:bg-[#151515] dark:text-white dark:focus:border-[#22c7a9]";

function classeAviso(tipo: string) {
  if (tipo === "ok") {
    return "bg-green-500/10 text-green-600 dark:text-green-400";
  }

  return "bg-red-500/10 text-red-600 dark:text-red-400";
}

export function Perfil() {
  const { usuario, pode, atualizarUsuario } = useUsuario();
  const ID_USUARIO = usuario?.id ?? 0;

  const podeEditar = pode("perfil.editarProprio");
  const podeAlterarSenha = pode("perfil.alterarSenha");

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [cargo, setCargo] = useState(usuario?.cargo ?? "");
  const [telefone, setTelefone] = useState(usuario?.telefone ?? "");

  const [erroNome, setErroNome] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [erroTelefone, setErroTelefone] = useState("");
  const [avisoPerfil, setAvisoPerfil] = useState<any>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [contaAtiva, setContaAtiva] = useState(true);

  const [fotoPerfil, setFotoPerfil] = useState("");
  const [fotoPreview, setFotoPreview] = useState("");
  const [erroFoto, setErroFoto] = useState("");
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [ultimoAcesso, setUltimoAcesso] = useState(usuario?.ultimoAcessoEm ?? "");
  const [membroDesde, setMembroDesde] = useState(usuario?.membroDesde ?? "");
  const [senhaAlteradaEm, setSenhaAlteradaEm] = useState(
    usuario?.senhaAlteradaEm ?? ""
  );

  const [modalSenha, setModalSenha] = useState(false);
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [avisoSenha, setAvisoSenha] = useState<any>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        const dados = await buscarPerfil(ID_USUARIO);

        if (!ativo) return;

        setNome(dados.nome ?? "");
        setEmail(dados.email ?? "");
        setCargo(dados.cargo ?? "");
        setTelefone(formatarTelefone(dados.telefone ?? ""));
        setFotoPerfil(dados.fotoPerfil ?? "");
        setContaAtiva(dados.acessoAtivo ?? false);

        const dataCriacao = dados.dataCriacaoConta ?? "";
        const dataSenha = dados.dataAlteracaoSenha ?? "";
        const acesso = dados.ultimoAcesso ?? "";

        setMembroDesde(dataCriacao);
        setSenhaAlteradaEm(dataSenha);
        setUltimoAcesso(acesso);

        atualizarUsuario({
          nome: dados.nome ?? "",
          email: dados.email ?? "",
          cargo: dados.cargo ?? "",
          telefone: formatarTelefone(dados.telefone ?? ""),
          fotoPerfil: dados.fotoPerfil ?? "",
          membroDesde: dataCriacao,
          senhaAlteradaEm: dataSenha,
          ultimoAcessoEm: acesso,
        });

        try {
          await registrarUltimoAcesso(ID_USUARIO);

          if (!ativo) return;

          const novoAcesso = new Date().toISOString();

          setUltimoAcesso(novoAcesso);
          atualizarUsuario({ ultimoAcessoEm: novoAcesso });
        } catch (erro) {
          console.error("Erro ao registrar último acesso:", erro);
        }
      } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);

        if (ativo) {
          setAvisoPerfil({
            tipo: "erro",
            texto: "Não foi possível carregar os dados do perfil. Verifique a conexão com o backend.",
          });
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, []);

  function fecharModalSenha() {
    setModalSenha(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setMostrarSenhaAtual(false);
    setMostrarNovaSenha(false);
    setMostrarConfirmacao(false);
    setAvisoSenha(null);
  }

  useEffect(() => {
    if (!modalSenha) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") fecharModalSenha();
    }

    window.addEventListener("keydown", aoTeclar);

    return () => window.removeEventListener("keydown", aoTeclar);
  }, [modalSenha]);

  function alterarCampo(campo: string, valor: string) {
    if (campo === "nome") {
      setNome(valor);
      setErroNome("");
    }

    if (campo === "email") {
      setEmail(valor);
      setErroEmail("");
    }

    if (campo === "telefone") {
      setTelefone(formatarTelefone(valor));
      setErroTelefone("");
    }

    setAvisoPerfil(null);
  }

  async function salvarPerfil() {
    const novoErroNome = validarNome(nome);
    const novoErroEmail = validarEmail(email);
    const novoErroTelefone = validarTelefone(telefone);

    setErroNome(novoErroNome);
    setErroEmail(novoErroEmail);
    setErroTelefone(novoErroTelefone);

    if (novoErroNome || novoErroEmail || novoErroTelefone) {
      setAvisoPerfil({
        tipo: "erro",
        texto: "Corrija os campos destacados.",
      });
      return;
    }

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const telefoneLimpo = telefone.replace(/\D/g, "");

    const dados = {
      nome: nomeLimpo,
      email: emailLimpo,
      telefone: telefoneLimpo,
      fotoPerfil: fotoPerfil,
    };

    setSalvando(true);
    setAvisoPerfil(null);

    try {
      await atualizarPerfil(ID_USUARIO, dados);

      setNome(nomeLimpo);
      setEmail(emailLimpo);

      atualizarUsuario({
        nome: nomeLimpo,
        email: emailLimpo,
        telefone,
        fotoPerfil,
      });

      setAvisoPerfil({
        tipo: "ok",
        texto: "Perfil atualizado com sucesso no backend!",
      });

      setTimeout(() => setAvisoPerfil(null), 6000);
    } catch (erro: any) {
      console.error("Erro ao salvar perfil:", erro);

      setAvisoPerfil({
        tipo: "erro",
        texto: erro.message || "Não foi possível salvar as alterações.",
      });
    } finally {
      setSalvando(false);
    }
  }

  function escolherFoto(evento: any) {
    const arquivo = evento.target.files[0];
    evento.target.value = "";

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErroFoto("Escolha um arquivo de imagem.");
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      setErroFoto("A imagem deve ter no máximo 2 MB.");
      return;
    }

    setErroFoto("");
    reduzirImagem(arquivo)
      .then((imagem) => {
        // A foto só é gravada no back-end ao clicar em salvar.
        setFotoPreview(imagem);
        setFotoPerfil(imagem);
      })
      .catch((erro) => setErroFoto(erro.message));
  }

  function alterarSenha(evento: any) {
    evento.preventDefault();

    const erro = validarNovaSenha(senhaAtual, novaSenha, confirmarSenha);

    if (erro !== "") {
      setAvisoSenha({ tipo: "erro", texto: erro });
      return;
    }

    setAvisoSenha({
      tipo: "erro",
      texto: "A validação passou, mas a alteração ainda depende da criação do endpoint no backend Java.",
    });
  }

  return (
    <main className="app-shell">
      <Sidebar ativo="/perfil" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="app-header">
          <div>
            <h1 className="app-title">Perfil</h1>

            <p className="text-sm text-gray-500 dark:text-[#8fa9a3]">
              Gerencie suas informações pessoais
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Notificacoes className="text-gray-700 dark:text-[#b9d2cc]" />

            <div className="app-avatar">
              <img
                src={fotoOuPadrao(fotoPreview || fotoPerfil, nome)}
                alt={usuario?.nome ?? "Perfil"}
                className="h-full w-full rounded-full object-cover"
              />
            </div>

            <span className="text-lg font-semibold text-gray-900 dark:text-[#f5fffc]">
              {nome}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="app-page-grid">
            <div className="grid grid-cols-1 gap-4">
              <div className="app-card flex flex-col items-center px-5 py-8 text-center">
                <div className="relative mb-4">
                  <div className="h-36 w-36 overflow-hidden rounded-full bg-[#dbe5e5]">
                    <img
                      src={fotoOuPadrao(fotoPreview || fotoPerfil, nome)}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {podeEditar && (
                    <>
                      <button
                        type="button"
                        onClick={() => inputFotoRef.current?.click()}
                        aria-label="Alterar foto de perfil"
                        title="Alterar foto de perfil"
                        className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0d7f70] text-white shadow-md transition hover:bg-[#09695e]"
                      >
                        <Camera size={17} />
                      </button>

                      <input
                        ref={inputFotoRef}
                        type="file"
                        accept="image/*"
                        onChange={escolherFoto}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {nome}
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-[#91aaa5]">
                  {usuario ? nomeDoPerfil(usuario.perfil) : ""}
                </p>

                <p className="mt-1 text-center text-xs text-gray-400 dark:text-[#718985]">
                  {email}
                </p>

                {erroFoto && (
                  <p
                    role="alert"
                    className="mt-3 text-center text-xs text-red-500 dark:text-red-400"
                  >
                    {erroFoto}
                  </p>
                )}

                {fotoPreview && !erroFoto && (
                  <p className="mt-3 text-center text-xs text-gray-400 dark:text-[#718985]">
                    Nova foto selecionada. Clique em salvar para gravá-la.
                  </p>
                )}

                <div className="mt-5 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  {contaAtiva ? "Conta ativa" : "Conta inativa"}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="app-card p-5">
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Informações pessoais
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-[#8fa9a3]">
                      Atualize suas informações de acesso e contato
                    </p>
                  </div>

                  {carregando ? (
                    <p className="py-5 text-sm text-gray-500 dark:text-[#8fa9a3]">
                      Carregando dados do perfil...
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="nome"
                          className="text-sm font-medium text-gray-700 dark:text-[#c4d3d0]"
                        >
                          Nome
                        </label>

                        <div className="relative">
                          <UserRound
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />

                          <input
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) => alterarCampo("nome", e.target.value)}
                            readOnly={!podeEditar}
                            aria-invalid={erroNome !== "" ? true : undefined}
                            aria-describedby={erroNome ? "erro-nome" : undefined}
                            className={`${CLASSE_CAMPO}${erroNome ? " !border-red-400" : ""}`}
                          />
                        </div>

                        {erroNome && (
                          <p id="erro-nome" role="alert" className="text-xs text-red-500 dark:text-red-400">
                            {erroNome}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700 dark:text-[#c4d3d0]"
                        >
                          E-mail
                        </label>

                        <div className="relative">
                          <Mail
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />

                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => alterarCampo("email", e.target.value)}
                            readOnly={!podeEditar}
                            aria-invalid={erroEmail ? true : undefined}
                            aria-describedby={erroEmail ? "erro-email" : undefined}
                            className={`${CLASSE_CAMPO}${erroEmail ? " !border-red-400" : ""}`}
                          />
                        </div>

                        {erroEmail && (
                          <p id="erro-email" role="alert" className="text-xs text-red-500 dark:text-red-400">
                            {erroEmail}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="cargo"
                          className="text-sm font-medium text-gray-700 dark:text-[#c4d3d0]"
                        >
                          Cargo
                        </label>

                        <div className="relative">
                          <Briefcase
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />

                          <input
                            id="cargo"
                            type="text"
                            value={cargo}
                            readOnly
                            title="A alteração do cargo ainda não está disponível pela API de perfil."
                            className={CLASSE_CAMPO}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="telefone"
                          className="text-sm font-medium text-gray-700 dark:text-[#c4d3d0]"
                        >
                          Telefone
                        </label>

                        <div className="relative">
                          <Phone
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />

                          <input
                            id="telefone"
                            type="tel"
                            value={telefone}
                            onChange={(e) => alterarCampo("telefone", e.target.value)}
                            readOnly={!podeEditar}
                            aria-invalid={erroTelefone ? true : undefined}
                            aria-describedby={erroTelefone ? "erro-telefone" : undefined}
                            className={`${CLASSE_CAMPO}${erroTelefone ? " !border-red-400" : ""}`}
                          />
                        </div>

                        {erroTelefone && (
                          <p id="erro-telefone" role="alert" className="text-xs text-red-500 dark:text-red-400">
                            {erroTelefone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {avisoPerfil && (
                    <div
                      role="status"
                      className={`mt-5 rounded-xl px-4 py-3 text-sm ${classeAviso(avisoPerfil.tipo)}`}
                    >
                      {avisoPerfil.texto}
                    </div>
                  )}

                  {podeEditar && (
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={salvarPerfil}
                        disabled={carregando || salvando}
                        className="flex items-center gap-2 rounded-lg bg-[#0d7f70] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#09695e] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save size={17} />
                        {salvando ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="app-card p-5">
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Atividade da conta
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-[#8fa9a3]">
                      Informações sobre sua conta no EduControl
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-white/10">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d7f70]/10 text-[#0d7f70] dark:bg-[#22c7a9]/10 dark:text-[#22c7a9]">
                        <Clock size={18} />
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-[#8fa9a3]">
                          Último acesso
                        </p>

                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatarUltimoAcesso(ultimoAcesso)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-white/10">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d7f70]/10 text-[#0d7f70] dark:bg-[#22c7a9]/10 dark:text-[#22c7a9]">
                        <ShieldCheck size={18} />
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-[#8fa9a3]">
                          Nível de acesso
                        </p>

                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {usuario ? nomeDoPerfil(usuario.perfil) : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-white/10">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d7f70]/10 text-[#0d7f70] dark:bg-[#22c7a9]/10 dark:text-[#22c7a9]">
                        <CalendarDays size={18} />
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-[#8fa9a3]">
                          Membro desde
                        </p>

                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatarDataLonga(membroDesde)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="app-card p-5">
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Segurança
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-[#8fa9a3]">
                      Gerencie a segurança da sua conta
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0d7f70]/10 text-[#0d7f70] dark:bg-[#22c7a9]/10 dark:text-[#22c7a9]">
                          <Lock size={19} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Senha
                          </p>

                          <p className="mt-1 text-xs text-gray-500 dark:text-[#8fa9a3]">
                            Última alteração: {formatarDataCurta(senhaAlteradaEm)}
                          </p>
                        </div>
                      </div>

                      {podeAlterarSenha && (
                        <button
                          type="button"
                          onClick={() => setModalSenha(true)}
                          className="rounded-xl border border-[#0d7f70]/30 px-4 py-2 text-sm font-medium text-[#0d7f70] transition hover:bg-[#0d7f70]/10 dark:text-[#22c7a9]"
                        >
                          Alterar senha
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0d7f70]/10 text-[#0d7f70] dark:bg-[#22c7a9]/10 dark:text-[#22c7a9]">
                          <ShieldCheck size={19} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Sessões ativas
                          </p>

                          <p className="mt-1 text-xs text-gray-500 dark:text-[#8fa9a3]">
                            Você está conectado neste dispositivo.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled
                        title="Disponível após a integração com o backend"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-[#d8e5e2] dark:hover:bg-white/5"
                      >
                        Ver sessões
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalSenha && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-senha"
          onClick={fecharModalSenha}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151515]"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2
                  id="titulo-modal-senha"
                  className="text-lg font-semibold text-[#17332e] dark:text-white"
                >
                  Alterar senha
                </h2>

                <p className="mt-1 text-sm text-[#6f8781] dark:text-[#8fa9a3]">
                  Atualize a senha da sua conta.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModalSenha}
                aria-label="Fechar"
                className="rounded-lg p-2 text-[#6f8781] transition hover:bg-black/5 hover:text-[#17332e] dark:text-[#8fa9a3] dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={alterarSenha} noValidate>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="senha-atual"
                    className="mb-2 block text-sm font-medium text-[#17332e] dark:text-white"
                  >
                    Senha atual
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa9a3]"
                    />

                    <input
                      id="senha-atual"
                      type={mostrarSenhaAtual ? "text" : "password"}
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Digite sua senha atual"
                      className="w-full rounded-xl border border-black/10 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#0d7f70] dark:border-white/10 dark:bg-[#1c1c1c] dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                      aria-label={mostrarSenhaAtual ? "Ocultar senha atual" : "Mostrar senha atual"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa9a3]"
                    >
                      {mostrarSenhaAtual ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="nova-senha"
                    className="mb-2 block text-sm font-medium text-[#17332e] dark:text-white"
                  >
                    Nova senha
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa9a3]"
                    />

                    <input
                      id="nova-senha"
                      type={mostrarNovaSenha ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Digite a nova senha"
                      className="w-full rounded-xl border border-black/10 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#0d7f70] dark:border-white/10 dark:bg-[#1c1c1c] dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                      aria-label={mostrarNovaSenha ? "Ocultar nova senha" : "Mostrar nova senha"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa9a3]"
                    >
                      {mostrarNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmar-senha"
                    className="mb-2 block text-sm font-medium text-[#17332e] dark:text-white"
                  >
                    Confirmar nova senha
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa9a3]"
                    />

                    <input
                      id="confirmar-senha"
                      type={mostrarConfirmacao ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Digite novamente a nova senha"
                      className="w-full rounded-xl border border-black/10 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#0d7f70] dark:border-white/10 dark:bg-[#1c1c1c] dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                      aria-label={mostrarConfirmacao ? "Ocultar confirmação" : "Mostrar confirmação"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa9a3]"
                    >
                      {mostrarConfirmacao ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {avisoSenha && (
                  <div
                    role="status"
                    className={`rounded-xl px-4 py-3 text-sm ${classeAviso(avisoSenha.tipo)}`}
                  >
                    {avisoSenha.texto}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fecharModalSenha}
                  className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-[#526a65] transition hover:bg-black/5 dark:border-white/10 dark:text-[#b9d2cc] dark:hover:bg-white/10"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#0d7f70] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#09695e]"
                >
                  Alterar senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
