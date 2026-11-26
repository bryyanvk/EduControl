import {
  Mail,
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  Lock, 
  Users,
  BarChart3,
  Zap,
}from "lucide-react";
import { useNavigate } from "react-router";
import { fazerLogin } from "~/auth/sessao";
import { redefinirSenhaComCodigo, solicitarRecuperacaoSenha } from "~/services/api";
import { useState } from "react";

export function Log() {
  const navigate = useNavigate();

  const[email,setEmail] = useState("");
  const[password,setPassword] = useState("");
  const[showPassword, setShowPassword ] = useState(false)
  const[mensagemErro,setMensagemErro] = useState("");

  const [entrando, setEntrando] = useState(false);

  // Recuperação de senha: 1) informa o e-mail, 2) informa o código recebido e a nova senha.
  const [recuperando, setRecuperando] = useState(false);
  const [etapaRecuperacao, setEtapaRecuperacao] = useState(1);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [codigoRecuperacao, setCodigoRecuperacao] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [erroRecuperacao, setErroRecuperacao] = useState("");
  const [sucessoRecuperacao, setSucessoRecuperacao] = useState("");
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);

  function abrirRecuperacao() {
    setRecuperando(true);
    setEtapaRecuperacao(1);
    setEmailRecuperacao(email.includes("@") ? email.trim() : "");
    setCodigoRecuperacao("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setErroRecuperacao("");
    setSucessoRecuperacao("");
  }

  async function enviarRecuperacao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroRecuperacao("");
    setSucessoRecuperacao("");

    const emailLimpo = emailRecuperacao.trim().toLowerCase();

    if (etapaRecuperacao === 1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
        setErroRecuperacao("Informe um e-mail válido.");
        return;
      }

      setEnviandoRecuperacao(true);
      try {
        await solicitarRecuperacaoSenha(emailLimpo);
        setEtapaRecuperacao(2);
        setSucessoRecuperacao("Se o e-mail estiver cadastrado, você receberá um código para redefinir a senha.");
      } catch (erro: any) {
        setErroRecuperacao(erro instanceof TypeError ? "Não foi possível conectar ao servidor." : erro.message);
      } finally {
        setEnviandoRecuperacao(false);
      }
      return;
    }

    if (codigoRecuperacao.trim() === "") {
      setErroRecuperacao("Informe o código recebido.");
      return;
    }
    if (novaSenha.length < 8) {
      setErroRecuperacao("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setErroRecuperacao("A confirmação não confere com a nova senha.");
      return;
    }

    setEnviandoRecuperacao(true);
    try {
      await redefinirSenhaComCodigo(emailLimpo, codigoRecuperacao.trim(), novaSenha);
      setRecuperando(false);
      setMensagemErro("");
      setPassword("");
      setSenhaRedefinida(true);
    } catch (erro: any) {
      setErroRecuperacao(erro instanceof TypeError ? "Não foi possível conectar ao servidor." : erro.message);
    } finally {
      setEnviandoRecuperacao(false);
    }
  }
  const [senhaRedefinida, setSenhaRedefinida] = useState(false);

  const handlelogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensagemErro("");
    setEntrando(true);

    try {
      await fazerLogin(email, password);
      navigate("/home");
    } catch (erro: any) {
      if (erro instanceof TypeError) {
        setMensagemErro("Não foi possível conectar ao servidor. Verifique se o back-end está ligado.");
      } else {
        setMensagemErro(erro?.message || "E-mail ou senha incorretos.");
      }
    } finally {
      setEntrando(false);
    }
  };
  return (
    <main className="app-login-shell">
      <div className="app-login-container">
      <div className="relative hidden h-screen w-1/2 overflow-hidden lg:block bg-[#0d4c5c]">

       <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10"></div>
       <div className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-white/[0.07]"></div>
       <div className="pointer-events-none absolute right-10 top-[55%] h-24 w-24 rounded-full bg-white/5"></div>
      

       <div className="app-login-rigth">

        <div className="app-login-brand">
         <div className="app-login-logo">
           <GraduationCap className="app-login-logo-icon" />

            <span className="app-login-logo-text">
             <span className="app-login-logo-edu">Edu</span>
             <span className="app-login-logo-control">Control</span>
           </span>
         </div>

         <p className="app-login-subtitle">
           Gestão escolar
         </p>


         </div>


        <div className="app-login-info">
          <div className="app-login-welcome-text"> 
             <span className="app-login-welcome-bem">Bem-</span>
             <span className="app-login-welcome-vindo">vindo</span>
          </div>

          <p className="app-login-welcome-description">
            Tenha uma gestão escolar mais simples,organizada e eficiente
          </p>

          <div className="app-login-features">
             <div className="app-login-feature">
              <div className="app-login-feature-icon">
               <Users
                 size={22}/>
              </div>

              <div>
              <h3> Gestão completa</h3>
                <p>
                 Sistema completo de gestão escolar, com acompanhamento dos alunos, professores, turmas e muito mais.
                </p>
              </div>
             </div>
          
          <div className="app-login-feature">
             <div className="app-login-feature-icon">
               <BarChart3
                 size={22}/>
             </div>

             <div>
              <h3> Praticidade</h3>
                <p>
                 Uma plataforma intuitiva para facilitar sua rotina.
                </p>
             </div>

          </div>
          <div className="app-login-feature">
             <div className="app-login-feature-icon">
               <Zap
                 size={22}/>
             </div>

             <div>
              <h3> Acompanhamento escolar</h3>
                <p>
                 Acompanhe alunos, presença e desempenho com facilidade.
                </p>
             </div>
          </div>
        </div>
      </div>
        
      </div>

      </div>

      
      <section className="flex h-screen w-full items-start justify-center overflow-hidden px-6  lg:w-1/2">
      <div className="w-full max-w-md pt-24 ">

    <form 
    onSubmit={handlelogin}
    className="mx-auto w-full max-w-md">

    <div className="app-login-welcome">
      <h2 className="app-login-title2">
        Seja bem vindo!
      </h2>
      <p className="app-login-description">
        Por favor insira seus dados
      </p>
    </div>

      {senhaRedefinida && (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          Senha redefinida com sucesso. Entre com a nova senha.
        </p>
      )}

      {mensagemErro !== "" && (
        <p role="alert" className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {mensagemErro}
        </p>
      )}
      

      <div className="mb-4 flex flex-col gap-2">
        <label htmlFor="email" className="font-medium text-white/60">
          E-mail ou matrícula
        </label>

        <div className="relative">
          <Mail
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            id="email"
            type="text"
            autoComplete="username"
            placeholder="seu@email.com ou matrícula"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 outline-none focus:border-[#0d7f70] dark:border-white/15 dark:bg-[#151515] dark:text-white dark:focus:border-[#22c7a9]"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <label htmlFor="password" className="font-medium text-white/60">
          Senha
        </label>

        <div className="relative">
          <Lock
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            id="password"
            type={showPassword  ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 outline-none focus:border-[#0d7f70] dark:border-white/15 dark:bg-[#151515] dark:text-white dark:focus:border-[#22c7a9]"
          />
          <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="app-login-show">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#7aaeb8]"
          />

          <span className="text-sm text-gray-300">
            Lembrar de mim
          </span>
        </label>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            abrirRecuperacao();
          }}
          className="app-login-forgot"
        >
          Esqueceu sua senha?
        </a>
      </div>

      <button
        type="submit"
        disabled={entrando}
        className="app-button-entrar"
      >
        <div className="flex items-center justify-center">
          {entrando ? "Entrando..." : "Entrar"}
        </div>

        <ArrowRight
          size={20}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        />
      </button>

     <div className="app-login-divider">
       <span></span>
       <p>ou continue</p>
       <span></span>
     </div>

     <button
     type="button"
     className="app-google-button"
     onClick={() => navigate("/em-construcao")}
     >
      <span className="app-google-icon">G </span>
      <span>Entrar com o Google</span>
     </button>

     
         </form>
       </div>
      </section>
      </div>
      {recuperando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setRecuperando(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-label="Recuperar senha"
            onClick={(e) => e.stopPropagation()}
            onSubmit={enviarRecuperacao}
            className="w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-2xl dark:bg-[#0a141a] dark:text-white"
          >
            <h2 className="text-xl font-bold">Recuperar senha</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {etapaRecuperacao === 1
                ? "Informe o e-mail cadastrado na sua conta."
                : "Digite o código recebido e escolha a nova senha."}
            </p>

            {erroRecuperacao !== "" && (
              <p role="alert" className="mt-3 rounded-lg bg-red-500/10 p-2 text-sm text-red-500">
                {erroRecuperacao}
              </p>
            )}
            {sucessoRecuperacao !== "" && (
              <p className="mt-3 rounded-lg bg-emerald-500/10 p-2 text-sm text-emerald-600 dark:text-emerald-300">
                {sucessoRecuperacao}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                placeholder="seu@email.com"
                value={emailRecuperacao}
                disabled={etapaRecuperacao === 2}
                onChange={(e) => setEmailRecuperacao(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-[#0d7f70] disabled:opacity-60 dark:border-white/15 dark:bg-[#151515] dark:text-white"
              />

              {etapaRecuperacao === 2 && (
                <>
                  <input
                    type="text"
                    placeholder="Código recebido"
                    value={codigoRecuperacao}
                    onChange={(e) => setCodigoRecuperacao(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-[#0d7f70] dark:border-white/15 dark:bg-[#151515] dark:text-white"
                  />
                  <input
                    type="password"
                    placeholder="Nova senha (mínimo 8 caracteres)"
                    autoComplete="new-password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-[#0d7f70] dark:border-white/15 dark:bg-[#151515] dark:text-white"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar nova senha"
                    autoComplete="new-password"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-[#0d7f70] dark:border-white/15 dark:bg-[#151515] dark:text-white"
                  />
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRecuperando(false)}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviandoRecuperacao}
                className="cursor-pointer rounded-lg bg-[#0d4c5c] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {enviandoRecuperacao
                  ? "Enviando..."
                  : etapaRecuperacao === 1
                    ? "Enviar código"
                    : "Redefinir senha"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
