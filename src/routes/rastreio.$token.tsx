import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Package, Truck, Home, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import olxLogo from "@/assets/olx-logo.png";

export const Route = createFileRoute("/rastreio/$token")({
  head: () => ({
    meta: [
      { title: "Rastreio da entrega - OLX" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TrackingPublicPage,
});

interface Row {
  id: string;
  status: string;
  tracking_code: string | null;
  tracking_url: string | null;
  product_name: string | null;
  product_price: number | null;
  product_image: string | null;
  product_slug: string | null;
  created_at: string;
  updated_at: string;
}

function BRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmt(d: string) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const STEPS = [
  { key: "confirmed", label: "Pagamento confirmado", icon: CheckCircle2, desc: "Recebemos a confirmação do pagamento." },
  { key: "posted",    label: "Pedido postado",       icon: Package,      desc: "Seu pedido foi postado e está a caminho do centro de distribuição." },
  { key: "shipped",   label: "Em transporte",        icon: Truck,        desc: "O pedido está em rota para sua região." },
  { key: "delivered", label: "Entregue",             icon: Home,         desc: "Pedido entregue no endereço de destino." },
];

function currentStepIndex(status: string, createdAt: string): number {
  if (status === "delivered") return 3;
  if (status === "shipped") return 2;
  if (status === "posted") return 1;
  // auto-progress by elapsed time so the customer sees movement
  const hours = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  if (hours >= 48) return 2;
  if (hours >= 6) return 1;
  return 0;
}

function TrackingPublicPage() {
  const { token } = Route.useParams();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      const { data } = await supabase.rpc("get_tracking_by_token", { p_token: token });
      const r = Array.isArray(data) ? data[0] : data;
      if (!stopped) { setRow(r ?? null); setLoading(false); }
    };
    load();
    const iv = setInterval(load, 15000);
    return () => { stopped = true; clearInterval(iv); };
  }, [token]);

  const step = row ? currentStepIndex(row.status, row.created_at) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 md:px-8">
        <Link to="/"><img src={olxLogo} alt="OLX" className="h-7" /></Link>
      </header>

      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-xl mx-auto">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              Carregando rastreio...
            </div>
          ) : !row ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-slate-900 font-semibold">Rastreio não encontrado</p>
              <p className="text-sm text-slate-500 mt-1">Verifique o link enviado pelo vendedor.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                  <Package className="w-4 h-4" /> Detalhes do pedido
                </div>
                <div className="flex gap-4">
                  {row.product_image && (
                    <img src={row.product_image} alt="" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-medium line-clamp-2">{row.product_name || "Produto"}</p>
                    {row.product_price != null && Number(row.product_price) > 0 && (
                      <p className="text-[#6e0ad6] font-bold mt-1">{BRL(Number(row.product_price))}</p>
                    )}
                    {row.tracking_code && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        Código: <span className="font-mono text-slate-800">{row.tracking_code}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mt-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold mb-4">
                  <Truck className="w-4 h-4" /> Andamento da entrega
                </div>
                <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
                  {STEPS.map((s, i) => {
                    const done = i <= step;
                    const active = i === step;
                    const Icon = s.icon;
                    return (
                      <li key={s.key} className="pl-6 relative">
                        <span
                          className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                            done ? "bg-[#6e0ad6] border-[#6e0ad6] text-white" : "bg-white border-slate-300 text-slate-400"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <p className={`font-semibold text-sm ${done ? "text-slate-900" : "text-slate-400"}`}>
                          {s.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${done ? "text-slate-600" : "text-slate-400"}`}>
                          {s.desc}
                        </p>
                        {active && (
                          <p className="text-xs text-[#6e0ad6] font-medium mt-1 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Atualizado em {fmt(row.updated_at)}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

              <p className="text-xs text-center text-slate-400 mt-4">
                Pedido criado em {fmt(row.created_at)}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
