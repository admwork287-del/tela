import { useEffect, useState } from "react";
import {
  Eye, Globe, Monitor, Shield, Trash2, RefreshCw, Loader2, User,
  CreditCard, MessageCircle, Star, LogIn, Ban, ShieldOff, ShoppingCart,
  MapPin, Copy, ExternalLink, Radio, Undo2, Pencil, CheckCircle2, Truck,
} from "lucide-react";
import { useActivities, useBlockedIps, useUserRole, useAuth } from "@/hooks/admin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

function getActivityIcon(type: string) {
  switch (type) {
    case "product_view": return Eye;
    case "seller_profile_view": return User;
    case "reviews_view": return Star;
    case "login_page_view":
    case "login_submit": return LogIn;
    case "register_page_view":
    case "register_submit": return User;
    case "pay_on_delivery_order":
    case "delivery_order": return Truck;
    case "pix_page_view":
    case "pix_generated": return CreditCard;
    case "pix_copied": return Copy;
    case "chat_opened":
    case "chat_open":
    case "chat_message_sent": return MessageCircle;
    case "secure_purchase_view": return ShoppingCart;
    case "address_registration": return MapPin;
    case "external_checkout_redirect": return ExternalLink;
    case "card_registration":
    case "native_checkout_started": return CreditCard;
    case "refund_copied": return Undo2;
    default: return Eye;
  }
}

function getActivityMessage(type: string) {
  const map: Record<string, string> = {
    product_view: "Visualizou o produto",
    seller_profile_view: "Acessou perfil do vendedor",
    reviews_view: "Visualizou avaliações",
    login_page_view: "Acessou página de login",
    register_page_view: "Acessou página de cadastro",
    register_submit: "Enviou formulário de cadastro",
    login_submit: "Enviou formulário de login",
    pix_page_view: "Acessou página do PIX",
    pix_generated: "PIX gerado",
    pix_copied: "Código PIX copiado",
    chat_opened: "Abriu o chat",
    chat_open: "Abriu o chat",
    chat_message_sent: "Enviou mensagem no chat",
    access: "Acessou a página",
    sale_completed: "Venda concluída",
    secure_purchase_view: "Acessou compra segura",
    address_registration: "Cadastrou endereço",
    external_checkout_redirect: "Redirecionado ao checkout externo",
    card_registration: "Cadastrou cartão de crédito",
    native_checkout_started: "Iniciou cadastro de cartão",
    refund_copied: "Copiou código de estorno",
    pay_on_delivery_order: "Solicitou pagar na entrega",
    delivery_order: "Pedido de pagar na entrega",
    payment_confirmed: "Pagamento confirmado",
    tracking_generated: "Rastreio gerado",
  };
  const known = map[type];
  if (known) return known;
  // Tipos desconhecidos: exibe o próprio tipo de forma legível, nunca genérico
  const readable = String(type || "").replace(/_/g, " ").trim();
  return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : "Atividade registrada";
}

function getActivityColor(type: string) {
  const c: Record<string, { icon: string; card: string; text: string }> = {
    pix_copied: { icon: "bg-green-600 text-white", card: "bg-green-100 border-green-300", text: "text-green-800" },
    external_checkout_redirect: { icon: "bg-violet-600 text-white", card: "bg-violet-100 border-violet-300", text: "text-violet-800" },
    pix_page_view: { icon: "bg-emerald-500 text-white", card: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
    pix_generated: { icon: "bg-emerald-500 text-white", card: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
    chat_opened: { icon: "bg-purple-500 text-white", card: "bg-purple-50 border-purple-200", text: "text-purple-700" },
    chat_open: { icon: "bg-purple-500 text-white", card: "bg-purple-50 border-purple-200", text: "text-purple-700" },
    chat_message_sent: { icon: "bg-pink-500 text-white", card: "bg-pink-50 border-pink-200", text: "text-pink-700" },
    login_page_view: { icon: "bg-blue-500 text-white", card: "bg-blue-50 border-blue-200", text: "text-blue-700" },
    register_page_view: { icon: "bg-cyan-500 text-white", card: "bg-cyan-50 border-cyan-200", text: "text-cyan-700" },
    register_submit: { icon: "bg-sky-600 text-white", card: "bg-sky-100 border-sky-300", text: "text-sky-800" },
    login_submit: { icon: "bg-blue-600 text-white", card: "bg-blue-100 border-blue-300", text: "text-blue-800" },
    secure_purchase_view: { icon: "bg-rose-500 text-white", card: "bg-rose-50 border-rose-200", text: "text-rose-700" },
    address_registration: { icon: "bg-teal-500 text-white", card: "bg-teal-50 border-teal-200", text: "text-teal-700" },
    product_view: { icon: "bg-indigo-500 text-white", card: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
    seller_profile_view: { icon: "bg-amber-500 text-white", card: "bg-amber-50 border-amber-200", text: "text-amber-700" },
    reviews_view: { icon: "bg-yellow-500 text-white", card: "bg-yellow-50 border-yellow-200", text: "text-yellow-700" },
    card_registration: { icon: "bg-red-600 text-white", card: "bg-red-100 border-red-300", text: "text-red-800" },
    native_checkout_started: { icon: "bg-orange-500 text-white", card: "bg-orange-50 border-orange-200", text: "text-orange-700" },
    refund_copied: { icon: "bg-violet-600 text-white", card: "bg-violet-100 border-violet-300", text: "text-violet-800" },
    pay_on_delivery_order: { icon: "bg-teal-600 text-white", card: "bg-teal-50 border-teal-200", text: "text-teal-800" },
    delivery_order: { icon: "bg-teal-600 text-white", card: "bg-teal-50 border-teal-200", text: "text-teal-800" },
  };
  return c[type] || { icon: "bg-gray-500 text-white", card: "bg-gray-50 border-gray-200", text: "text-gray-700" };
}

export function ActivityLog() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { activities, loading, deleteActivity, clearActivities, refetch } = useActivities();
  const { blockedIps, blockIp, unblockIp, updateRefundCode, isIpBlocked, getBlockedEntry } = useBlockedIps();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("activities-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities", filter: `user_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundCode, setRefundCode] = useState("");
  const [pendingBlockIp, setPendingBlockIp] = useState<string | null>(null);
  const [editRefundModalOpen, setEditRefundModalOpen] = useState(false);
  const [editRefundId, setEditRefundId] = useState<string | null>(null);
  const [editRefundCode, setEditRefundCode] = useState("");

  const handleDelete = (id: string) => {
    if (deleteActivity(id)) toast.success("Atividade removida");
  };
  const handleClearAll = () => {
    if (confirm("Tem certeza que deseja limpar todas as atividades?")) {
      clearActivities();
      toast.success("Todas as atividades foram removidas");
    }
  };
  const handleBlockIp = (ip: string) => {
    if (!ip || ip === "unknown") return toast.error("IP inválido para bloqueio");
    if (blockIp(ip)) toast.success(`IP ${ip} bloqueado com sucesso`);
    else toast.error("IP já está bloqueado");
  };
  const handleBlockWithRefund = (ip: string) => {
    if (!ip || ip === "unknown") return toast.error("IP inválido para bloqueio");
    setPendingBlockIp(ip);
    setRefundCode("");
    setRefundModalOpen(true);
  };
  const handleConfirmRefundBlock = () => {
    if (!pendingBlockIp || !refundCode.trim()) return toast.error("Informe o código de reembolso");
    if (blockIp(pendingBlockIp, "refund", refundCode.trim())) toast.success(`IP ${pendingBlockIp} bloqueado com estorno`);
    else toast.error("IP já está bloqueado");
    setRefundModalOpen(false);
    setPendingBlockIp(null);
    setRefundCode("");
  };

  const handleConfirmPayment = async (activity: any) => {
    if (!user) return;
    if (!activity.product_id) {
      return toast.error("Atividade sem produto vinculado");
    }
    if (!confirm("Confirmar pagamento deste cliente? Ele será redirecionado para a página de pagamento confirmado.")) return;
    const { data: prod } = await supabase
      .from("products")
      .select("id, slug, name, price, image1_url")
      .eq("id", activity.product_id)
      .maybeSingle();
    if (!prod) return toast.error("Produto não encontrado");
    const { error } = await supabase.from("tracking_orders").insert({
      user_id: user.id,
      product_id: prod.id,
      product_slug: prod.slug,
      product_name: prod.name,
      product_price: prod.price,
      product_image: prod.image1_url,
      customer_ip: activity.ip,
      status: "confirmed",
    } as any);
    if (error) return toast.error("Erro ao confirmar pagamento");
    toast.success("Pagamento confirmado! Cliente será redirecionado.");
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-4 lg:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Registro de Atividades</h2>
            <p className="text-sm text-slate-500 mt-0.5">Últimas 100 atividades registradas</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Tempo real</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full border-slate-200 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4 mr-2" />Atualizar
          </Button>
          {activities.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />Limpar
            </Button>
          )}
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <Eye className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-medium">Nenhuma atividade registrada ainda</p>
          <p className="text-sm mt-1">As atividades aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colors = getActivityColor(activity.type);
            return (
              <div key={activity.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${colors.card}`}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 lg:gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl shadow-sm flex-shrink-0 ${colors.icon}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${colors.text}`}>{getActivityMessage(activity.type)}</p>
                      {activity.product_name && (
                        <p className="text-xs text-slate-600 mt-1 font-medium truncate">📦 {activity.product_name}</p>
                      )}
                      {activity.details && (
                        <p className="text-xs text-slate-800 mt-1 whitespace-pre-wrap break-words bg-white/70 border border-slate-200 rounded-md px-2 py-1">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5">
                        🕐 {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {activity.ip && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isIpBlocked(activity.ip) ? "bg-red-100 text-red-700 line-through" : "bg-white text-slate-600 border border-slate-200 shadow-sm"}`}>
                            <Globe className="h-3 w-3" />{activity.ip}
                            {isIpBlocked(activity.ip) && <span className="text-red-600 ml-1">(bloqueado)</span>}
                          </span>
                        )}
                        {activity.browser && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 shadow-sm">
                            <Monitor className="h-3 w-3" />{activity.browser}
                          </span>
                        )}
                        {activity.os && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 shadow-sm">
                            <Shield className="h-3 w-3" />{activity.os}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {activity.ip && activity.ip !== "unknown" && (
                      isIpBlocked(activity.ip) ? (
                        <>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => {
                              const b = blockedIps.find((x) => x.ip === activity.ip);
                              if (b && unblockIp(b.id)) toast.success(`IP ${activity.ip} desbloqueado`);
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full h-8 w-8 p-0"
                            title="Desbloquear IP"
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                          {isAdmin && (() => {
                            const entry = getBlockedEntry(activity.ip!);
                            return entry?.refund_code ? (
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => {
                                  setEditRefundId(entry.id);
                                  setEditRefundCode(entry.refund_code || "");
                                  setEditRefundModalOpen(true);
                                }}
                                className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-full h-8 w-8 p-0"
                                title="Alterar código de estorno"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            ) : null;
                          })()}
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleBlockIp(activity.ip!)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full h-8 w-8 p-0" title="Bloquear IP">
                            <Ban className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => handleBlockWithRefund(activity.ip!)} className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-full h-8 w-8 p-0" title="Bloquear + Estorno">
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )
                    )}
                    {activity.type === "pix_copied" && activity.product_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfirmPayment(activity)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full h-8 w-8 p-0"
                        title="Confirmar pagamento"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(activity.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear com Estorno</DialogTitle>
            <DialogDescription>
              Informe o código PIX de reembolso que será exibido ao visitante bloqueado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">IP a ser bloqueado</label>
              <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2 font-mono">{pendingBlockIp}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Código PIX Copia e Cola (Estorno)</label>
              <Input value={refundCode} onChange={(e) => setRefundCode(e.target.value)} placeholder="Cole o código PIX aqui..." className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmRefundBlock} disabled={!refundCode.trim()}>
              <Undo2 className="h-4 w-4 mr-2" />Bloquear com Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editRefundModalOpen} onOpenChange={setEditRefundModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Código de Estorno</DialogTitle>
            <DialogDescription>
              Atualize o código PIX de reembolso que será exibido ao visitante bloqueado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Novo Código PIX</label>
              <Input value={editRefundCode} onChange={(e) => setEditRefundCode(e.target.value)} placeholder="Cole o novo código PIX aqui..." className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRefundModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!editRefundId || !editRefundCode.trim()) return;
                if (updateRefundCode(editRefundId, editRefundCode.trim())) toast.success("Código de estorno atualizado");
                else toast.error("Erro ao atualizar código");
                setEditRefundModalOpen(false);
                setEditRefundId(null);
                setEditRefundCode("");
              }}
              disabled={!editRefundCode.trim()}
            >
              <Pencil className="h-4 w-4 mr-2" />Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
