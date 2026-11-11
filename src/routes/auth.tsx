import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import olxLogo from "@/assets/olx-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar - OLX Painel" },
      { name: "description", content: "Acesse o painel administrativo da OLX." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bem-vindo!");
      navigate({ to: "/painel" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <img src={olxLogo} alt="OLX" className="mb-4 h-10" />
          <h1 className="text-xl font-bold text-slate-800">Entrar no painel</h1>
          <p className="mt-1 text-xs text-slate-500">Acesse sua área de gestão</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Aguarde..." : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Contas são criadas apenas pelo administrador.
        </p>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">← Voltar ao site</Link>
        </div>
      </div>
    </div>
  );
}
