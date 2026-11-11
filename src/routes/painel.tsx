import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/admin";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel Admin - OLX" },
      { name: "description", content: "Painel administrativo da OLX." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PainelLayout,
});

function PainelLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
