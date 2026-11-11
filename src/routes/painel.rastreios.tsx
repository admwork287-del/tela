import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Package, Truck, Trash2, Copy, ExternalLink, Save, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/painel/rastreios")({
  component: TrackingPage,
});

interface TrackingOrder {
  id: string;
  product_id: string | null;
  product_slug: string | null;
  product_name: string | null;
  product_price: number | null;
  product_image: string | null;
  customer_ip: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  tracking_token: string | null;
  status: string;
  created_at: string;
}

function genTrackingCode() {
  let n = "";
  for (let i = 0; i < 9; i++) n += Math.floor(Math.random() * 10);
  return `BR${n}BR`;
}

function BRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function TrackingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { code: string; url: string }>>({});

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tracking_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders((data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("tracking-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tracking_orders", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const getDraft = (o: TrackingOrder) =>
    drafts[o.id] ?? { code: o.tracking_code || "", url: o.tracking_url || "" };

  const setDraft = (id: string, patch: Partial<{ code: string; url: string }>) => {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? { code: "", url: "" }), ...patch } }));
  };

  const save = async (o: TrackingOrder) => {
    const d = getDraft(o);
    const { error } = await supabase
      .from("tracking_orders")
      .update({
        tracking_code: d.code.trim() || null,
        tracking_url: d.url.trim() || null,
        status: d.code.trim() || d.url.trim() ? "shipped" : o.status,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", o.id);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Rastreio salvo");
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este pedido?")) return;
    await supabase.from("tracking_orders").delete().eq("id", id);
    toast.success("Pedido removido");
  };

  const generate = async (o: TrackingOrder) => {
    const code = o.tracking_code?.trim() || genTrackingCode();
    const url = `${window.location.origin}/rastreio/${o.tracking_token}`;
    setDraft(o.id, { code, url });
    const { error } = await supabase
      .from("tracking_orders")
      .update({
        tracking_code: code,
        tracking_url: url,
        status: o.status === "confirmed" ? "shipped" : o.status,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", o.id);
    if (error) return toast.error("Erro ao gerar link");
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Link gerado e copiado");
  };

  const copyLink = async (o: TrackingOrder) => {
    if (!o.tracking_url) return;
    await navigator.clipboard.writeText(o.tracking_url);
    toast.success("Link copiado");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 flex items-center justify-center shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-4 lg:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6e0ad6] to-[#A855F7] text-white shadow-md">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Rastreios</h2>
          <p className="text-sm text-slate-500">Pedidos com pagamento confirmado</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <Package className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-medium">Nenhum pedido confirmado ainda</p>
          <p className="text-sm mt-1">Confirme um pagamento no registro de atividades para gerar um rastreio</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const d = getDraft(o);
            return (
              <div key={o.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    {o.product_image && (
                      <img src={o.product_image} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{o.product_name || "—"}</p>
                      {o.product_price != null && (
                        <p className="text-[#6e0ad6] font-bold text-sm">{BRL(Number(o.product_price))}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          IP: {o.customer_ip || "—"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${o.status === "shipped" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {o.status === "shipped" ? "Enviado" : "Confirmado"}
                        </span>
                        <span className="text-slate-500">
                          {format(new Date(o.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove(o.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Código de rastreio</label>
                    <Input
                      value={d.code}
                      onChange={(e) => setDraft(o.id, { code: e.target.value })}
                      placeholder="Ex: BR123456789BR"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Link de rastreio</label>
                    <Input
                      value={d.url}
                      onChange={(e) => setDraft(o.id, { url: e.target.value })}
                      placeholder="https://..."
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" onClick={() => generate(o)} className="bg-[#f78200] hover:bg-[#e67600] text-white">
                    <Wand2 className="w-4 h-4 mr-1.5" /> Gerar link de rastreio
                  </Button>
                  <Button size="sm" onClick={() => save(o)} variant="outline">
                    <Save className="w-4 h-4 mr-1.5" /> Salvar
                  </Button>
                  {o.tracking_url && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => copyLink(o)}>
                        <Copy className="w-4 h-4 mr-1.5" /> Copiar link
                      </Button>
                      <a href={o.tracking_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4 mr-1.5" /> Abrir
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
