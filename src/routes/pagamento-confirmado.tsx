import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Package, Truck, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorIp, fetchCheckoutProduct } from "@/lib/tracking";
import olxLogo from "@/assets/olx-logo.png";

type Search = { produto?: string };

export const Route = createFileRoute("/pagamento-confirmado")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    produto: typeof s.produto === "string" ? s.produto : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pagamento Confirmado - OLX" },
      { name: "description", content: "Seu pagamento foi confirmado." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PaymentConfirmedPage,
});

interface OrderRow {
  id: string;
  status: string;
  tracking_code: string | null;
  tracking_url: string | null;
  product_name: string | null;
  product_price: number | null;
  product_image: string | null;
  product_slug: string | null;
}

function BRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PaymentConfirmedPage() {
  const { produto: searchSlug } = useSearch({ from: "/pagamento-confirmado" }) as Search;
  const productSlug =
    searchSlug ??
    (typeof window !== "undefined"
      ? localStorage.getItem("olx_produto_slug") ?? undefined
      : undefined);

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [fallbackImg, setFallbackImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;
    const run = async () => {
      const ip = await getVisitorIp();
      if (!ip || !productSlug) { setLoading(false); return; }
      const { data } = await supabase.rpc("get_payment_confirmation_by_slug", {
        p_slug: productSlug,
        p_ip: ip,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (!stopped) {
        setOrder(row ?? null);
        setLoading(false);
      }
    };
    run();
    const iv = setInterval(run, 5000);
    return () => { stopped = true; clearInterval(iv); };
  }, [productSlug]);

  useEffect(() => {
    (async () => {
      if (!productSlug) return;
      const p = await fetchCheckoutProduct(productSlug);
      if (p?.image1_url) setFallbackImg(p.image1_url);
    })();
  }, [productSlug]);

  const image = order?.product_image || fallbackImg || "";
  const name = order?.product_name || "Produto";
  const price = Number(order?.product_price ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 md:px-8">
        <Link to="/"><img src={olxLogo} alt="OLX" className="h-7" /></Link>
      </header>

      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Pagamento confirmado!</h1>
            <p className="text-slate-600 mt-2">
              Recebemos a confirmação do seu pagamento. Em breve geraremos o código de rastreio da sua entrega.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mt-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
              <Package className="w-4 h-4" /> Detalhes do pedido
            </div>
            <div className="flex gap-4">
              {image && (
                <img src={image} alt={name} className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-medium line-clamp-2">{name}</p>
                {price > 0 && <p className="text-[#6e0ad6] font-bold mt-1">{BRL(price)}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mt-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
              <Truck className="w-4 h-4" /> Rastreio da entrega
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : order?.tracking_url || order?.tracking_code ? (
              <div className="space-y-3">
                {order.tracking_code && (
                  <div>
                    <p className="text-xs text-slate-500">Código de rastreio</p>
                    <p className="font-mono text-slate-900 text-sm mt-0.5">{order.tracking_code}</p>
                  </div>
                )}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#f78200] hover:bg-[#e67600] text-white font-semibold px-4 py-2.5 rounded-lg transition"
                  >
                    Acompanhar entrega <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Aguardando geração do rastreio. Assim que disponível, ele aparecerá aqui automaticamente.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
