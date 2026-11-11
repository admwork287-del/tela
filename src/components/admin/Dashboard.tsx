import { useAuth, useProducts, useSellerConfig, useUserStats, useUserRole } from "@/hooks/admin";
import { StatCard } from "@/components/admin/StatCard";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { User, CheckCircle, Loader2, Shield, Eye, CreditCard, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { loading: productsLoading } = useProducts();
  useSellerConfig();
  const { stats, profile, loading: statsLoading } = useUserStats();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || productsLoading || statsLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const validityText = profile?.valid_until
    ? format(new Date(profile.valid_until), "dd/MM/yyyy", { locale: ptBR })
    : "---";
  const isExpired = profile?.valid_until ? new Date(profile.valid_until) < new Date() : false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-[#2a0a4a] via-[#4c0d90] to-[#6e0ad6] p-6 shadow-xl shadow-purple-900/10 lg:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#f78200]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[#A855F7]/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-md lg:h-24 lg:w-24">
              <User className="h-10 w-10 text-white lg:h-12 lg:w-12" />
            </div>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 shadow-lg ring-2 ring-[#2a0a4a]">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
                {profile?.name || user?.email?.split("@")[0] || "Usuário"}
              </h2>
              {isAdmin && (
                <Badge className="border-0 bg-[#f78200] text-white shadow-sm hover:bg-[#f78200]">
                  <Shield className="mr-1 h-3 w-3" />Admin
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-sm text-white/70">
              ID do anunciante:{" "}
              <span className="font-mono font-semibold text-white">{profile?.display_id || "---"}</span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${
                isExpired
                  ? "bg-red-500/20 text-red-100 ring-1 ring-red-300/40"
                  : "bg-emerald-400/20 text-emerald-50 ring-1 ring-emerald-300/40"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isExpired ? "bg-red-400" : "animate-pulse bg-emerald-400"}`} />
              {isExpired ? "Expirado" : "Conta Ativa"}
            </span>
            <p className="text-xs text-white/70">
              Válido até:{" "}
              <span className={`font-semibold ${isExpired ? "text-red-200" : "text-white"}`}>{validityText}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        <StatCard label="Total de Acessos" value={stats?.total_access || 0} icon={Eye} iconColor="text-indigo-600" />
        <StatCard label="PIX Gerados" value={stats?.pix_generated || 0} icon={CreditCard} iconColor="text-emerald-600" />
        <StatCard label="PIX Copiados" value={stats?.pix_copied || 0} icon={Copy} iconColor="text-[#f78200]" />
      </div>

      <ActivityLog />
    </div>
  );
}
