import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Package, Truck, User } from "lucide-react";
import { fetchCheckoutProduct } from "@/lib/tracking";
import { supabase } from "@/integrations/supabase/client";
import olxLogo from "@/assets/olx-logo.png";

type Search = { produto?: string };

export const Route = createFileRoute("/pagamento-entrega")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    produto: typeof s.produto === "string" ? s.produto : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pagar na Entrega - OLX" },
      { name: "description", content: "Confirme seus dados para pagar na entrega." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DeliveryConfirmPage,
});

interface BuyerData {
  name: string;
  cpf: string;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
}

interface ProductInfo {
  id?: string;
  user_id?: string;
  name: string;
  price: number;
  garantia_olx: number;
  image1_url: string | null;
  seller_name: string;
  pay_on_delivery_whatsapp: string | null;
}

function BRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCpfInput(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length > 9) return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6, 9) + "-" + n.slice(9);
  if (n.length > 6) return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6);
  if (n.length > 3) return n.slice(0, 3) + "." + n.slice(3);
  return n;
}

function DeliveryConfirmPage() {
  const { produto: searchSlug } = useSearch({ from: "/pagamento-entrega" }) as Search;
  const productSlug =
    searchSlug ??
    (typeof window !== "undefined"
      ? localStorage.getItem("olx_produto_slug") ?? undefined
      : undefined);

  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [buyer, setBuyer] = useState<BuyerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [address, setAddress] = useState<{
    cep: string | null;
    rua: string | null;
    numero: string | null;
    complemento: string | null;
    referencia?: string | null;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== "undefined") {
          const rawBuyer = localStorage.getItem("olx_delivery_buyer");
          if (rawBuyer) {
            try {
              const parsed = JSON.parse(rawBuyer);
              setBuyer(parsed);
              setConfirmed(true);
            } catch {}
          }
          const rawAddr = localStorage.getItem("olx_delivery_address");
          if (rawAddr) {
            try {
              setAddress(JSON.parse(rawAddr));
            } catch {}
          }
        }
        if (productSlug) {
          const row = await fetchCheckoutProduct(productSlug);
          if (row) {
            setProduct({
              id: (row as any).id,
              user_id: (row as any).user_id,
              name: row.name,
              price: Number(row.price || 0),
              garantia_olx: Number(row.garantia_olx || 49),
              image1_url: row.image1_url,
              seller_name: row.seller_name || "Vendedor",
              pay_on_delivery_whatsapp: (row as any).pay_on_delivery_whatsapp ?? null,
            });
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [productSlug]);

  const handleConfirmData = async () => {
    if (!buyerName.trim()) return;
    if (buyerCpf.replace(/\D/g, "").length !== 11) return;
    setSaving(true);
    const data: BuyerData = {
      name: buyerName.trim(),
      cpf: buyerCpf,
      cep: address?.cep ?? null,
      rua: address?.rua ?? null,
      numero: address?.numero ?? null,
      complemento: address?.complemento ?? null,
    };
    try {
      if (product) {
        await supabase.from("delivery_orders").insert({
          user_id: product.user_id,
          product_id: product.id,
          product_slug: productSlug,
          product_name: product.name,
          product_price: product.price,
          buyer_name: data.name,
          buyer_cpf: data.cpf.replace(/\D/g, ""),
          cep: address?.cep ?? null,
          rua: address?.rua ?? null,
          numero: address?.numero ?? null,
          complemento: address?.complemento ?? null,
          referencia: address?.referencia ?? null,
          status: "pending",
        } as any);
      }
      try {
        localStorage.setItem("olx_delivery_buyer", JSON.stringify(data));
        localStorage.removeItem("olx_delivery_address");
      } catch {}
      setBuyer(data);
      setConfirmed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const whatsappNumber = product?.pay_on_delivery_whatsapp?.replace(/\D/g, "");
  const total = (product?.price || 0) + (product?.garantia_olx || 0);

  const message = encodeURIComponent(
    `Olá! Acabei de confirmar a compra do produto "${product?.name || ""}" no site e escolhi pagar na entrega. Meu nome é ${buyer?.name || ""}. Podemos confirmar e liberar a compra?`
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #d2d2d2",
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 md:px-8">
        <img src={olxLogo} alt="OLX" className="h-7" />
      </header>

      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-center">
            {confirmed ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Pedido confirmado!</h1>
                <p className="text-slate-600 mt-2">
                  Você escolheu pagar na entrega. O vendedor entrará em contato para combinar a entrega
                  e o pagamento será feito no momento em que você receber o produto.
                </p>
                <p className="text-slate-900 font-medium mt-4">
                  Para liberar o seu pedido, clique no botão abaixo.
                </p>
                {whatsappNumber ? (
                  <a
                    href={`https://wa.me/55${whatsappNumber}?text=${message}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full max-w-xs items-center justify-center py-3 text-sm font-medium text-white bg-[#25D366] rounded-full hover:bg-[#1eb85a] transition"
                  >
                    Confirmar e liberar compra
                  </a>
                ) : (
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="mt-4 w-full max-w-xs py-3 text-sm font-medium text-white bg-[#f56e00] rounded-full hover:bg-[#e06400] transition"
                  >
                    Entendi
                  </button>
                )}
              </>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Pagamento na entrega</h1>
                <p className="text-slate-600 mt-2">
                  Confirme seus dados para finalizar o pedido. Você pagará somente quando receber o produto.
                </p>
                <div className="mt-6 space-y-3 text-left max-w-sm mx-auto">
                  <input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Nome completo"
                    style={inputStyle}
                  />
                  <input
                    value={buyerCpf}
                    onChange={(e) => setBuyerCpf(formatCpfInput(e.target.value))}
                    placeholder="CPF"
                    inputMode="numeric"
                    style={inputStyle}
                  />
                  <button
                    onClick={handleConfirmData}
                    disabled={saving || !buyerName.trim() || buyerCpf.replace(/\D/g, "").length !== 11}
                    className="w-full py-3 text-sm font-medium text-white bg-[#f56e00] rounded-full hover:bg-[#e06400] transition disabled:opacity-50"
                  >
                    {saving ? "Confirmando..." : "Confirmar pedido"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mt-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
              <Package className="w-4 h-4" /> Detalhes da compra
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : product ? (
              <div className="flex gap-4">
                {product.image1_url && (
                  <img src={product.image1_url} alt={product.name} className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-medium line-clamp-2">{product.name}</p>
                  <p className="text-sm text-slate-500 mt-1">Vendido por: {product.seller_name}</p>
                  <div className="mt-2 text-sm text-slate-700 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Produto</span>
                      <span>{BRL(product.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Garantia da OLX</span>
                      <span>{BRL(product.garantia_olx)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total</span>
                      <span>{BRL(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Produto não encontrado.</p>
            )}
          </div>

          {buyer && confirmed && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mt-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                <User className="w-4 h-4" /> Seus dados
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                <p><span className="text-slate-500">Nome:</span> {buyer.name}</p>
                {buyer.cpf && <p><span className="text-slate-500">CPF:</span> {buyer.cpf}</p>}
                {(buyer.rua || buyer.cep) && (
                  <div className="flex items-start gap-2 pt-2 mt-2 border-t border-slate-100">
                    <Truck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <p>
                      {buyer.rua}{buyer.numero ? `, ${buyer.numero}` : ""}{buyer.complemento ? ` - ${buyer.complemento}` : ""}
                      {buyer.cep ? ` · CEP: ${buyer.cep}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
