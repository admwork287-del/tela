import { createFileRoute, useNavigate } from "@tanstack/react-router";
import olxLogo from "@/assets/olx-logo.png";
import garantiaHero from "@/assets/garantia-hero.png";
import payOnlineIcon from "@/assets/icons/pay-online-icon.png";
import deliveryGuaranteeIcon from "@/assets/icons/delivery-guarantee-icon.png";
import olxGuaranteeIcon from "@/assets/icons/olx-guarantee-icon.png";

export const Route = createFileRoute("/garantia")({
  head: () => ({
    meta: [
      { title: "Garantia OLX - Compre com Segurança" },
      {
        name: "description",
        content:
          "Receba exatamente o que comprou ou a OLX devolve seu dinheiro. Pagamento seguro via Pix ou cartão.",
      },
    ],
  }),
  component: Garantia,
});

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#fff" />
    <path d="M7.5 12.5L10.5 15.5L16.5 9" stroke="#6E0AD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#6E0AD6" strokeWidth="2" />
    <path d="M12 8h.01M11 12h1v4h1" stroke="#6E0AD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" stroke="#6E0AD6" strokeWidth="2" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="#6E0AD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const advantages = [
  {
    title: "Pagamento",
    strong: "100% protegido",
    text: "Seu dinheiro fica retido com a OLX e só é liberado para o vendedor depois que você receber e conferir o produto.",
  },
  {
    title: "Entrega",
    strong: "rastreada de ponta a ponta",
    text: "Acompanhe cada etapa do envio pelo código de rastreio e receba em casa ou retire no armário CliqueRetire.",
  },
  {
    title: "Reembolso",
    strong: "garantido pela OLX",
    text: "Se o produto não chegar ou não for como o anunciado, você solicita o reembolso e recebe 100% do valor pago.",
  },
  {
    title: "Atendimento",
    strong: "sempre que precisar",
    text: "Nosso time de suporte acompanha a negociação e ajuda a resolver qualquer problema com a sua compra.",
  },
];

function Garantia() {
  const navigate = useNavigate();

  return (
    <div className="garantia-page">
      <header className="garantia-header">
        <button className="garantia-back-btn" onClick={() => window.history.back()} aria-label="Voltar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <img src={olxLogo} alt="OLX" className="garantia-logo" />
      </header>

      <section className="garantia-hero">
        <div className="garantia-container garantia-hero-content">
          <div className="garantia-hero-text">
            <h1>
              <strong>Compre online</strong> com a{" "}
              <span className="garantia-hero-italic">garantia da OLX</span>
            </h1>
            <ul className="garantia-checklist">
              <li>
                <CheckIcon /> Pague via Pix ou em até 12x no cartão
              </li>
              <li>
                <CheckIcon /> Receba em casa com entrega rastreada
              </li>
              <li>
                <CheckIcon /> Receba o que comprou ou a OLX devolve seu dinheiro
              </li>
            </ul>
            <button className="garantia-btn-primary" onClick={() => navigate({ to: "/" })}>
              Ver anúncios
            </button>
          </div>
          <div className="garantia-hero-image">
            <img src={garantiaHero} alt="Garantia da OLX" />
          </div>
        </div>
      </section>

      <section className="garantia-about">
        <div className="garantia-container">
          <h2>
            Como funciona a <strong>Compra Segura OLX</strong>
          </h2>

          <div className="garantia-steps">
            <div className="garantia-step-box">
              <div className="garantia-step-icon">
                <img src={payOnlineIcon} alt="" />
              </div>
              <h3>1. Pague pela OLX</h3>
              <p>Escolha Pix ou cartão de crédito. O valor fica retido com a OLX até a entrega ser concluída.</p>
            </div>
            <div className="garantia-step-box">
              <div className="garantia-step-icon">
                <img src={deliveryGuaranteeIcon} alt="" />
              </div>
              <h3>2. Receba o produto</h3>
              <p>O vendedor envia o produto e você acompanha a entrega pelo rastreio até a sua casa.</p>
            </div>
            <div className="garantia-step-box">
              <div className="garantia-step-icon">
                <img src={olxGuaranteeIcon} alt="" />
              </div>
              <h3>3. Confira e aprove</h3>
              <p>Recebeu tudo certo? O pagamento é liberado. Teve problema? A OLX devolve o seu dinheiro.</p>
            </div>
          </div>

          <div className="garantia-warning" style={{ marginTop: 40 }}>
            <div className="garantia-warning-title">
              <InfoIcon />
              <h3>Nunca pague fora da OLX</h3>
            </div>
            <p>
              Pagamentos feitos por transferência direta, boleto de terceiros ou fora do site não têm a garantia
              da OLX. Faça todo o processo dentro da plataforma.
            </p>
          </div>
        </div>
      </section>

      <section className="garantia-advantages">
        <div className="garantia-container">
          <h2>
            Vantagens de comprar com a <strong>Garantia da OLX</strong>
          </h2>
          <div className="garantia-advantages-boxes">
            {advantages.map((a) => (
              <div className="garantia-advantage-box" key={a.title}>
                <div className="garantia-advantage-title">
                  <ShieldIcon />
                  <h3>
                    {a.title} <strong>{a.strong}</strong>
                  </h3>
                </div>
                <p>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="garantia-cta">
        <div className="garantia-container garantia-cta-content">
          <h2>Compre com segurança agora mesmo</h2>
          <button className="garantia-btn-primary" onClick={() => window.history.back()}>
            Voltar ao anúncio
          </button>
        </div>
      </section>

      <footer className="garantia-footer">
        <div className="garantia-container">
          <div className="garantia-footer-logo">
            <img src={olxLogo} alt="OLX" />
          </div>
          <p className="garantia-copyright">© 2026 OLX Brasil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
