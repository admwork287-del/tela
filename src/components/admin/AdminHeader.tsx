import { Bell, User, Menu, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import olxLogo from "@/assets/olx-logo.png";
import { useAuth, useUserRole } from "@/hooks/admin";
import { authActions } from "@/hooks/admin";

export function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authActions.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5 lg:hidden">
          <img src={olxLogo} alt="OLX" className="h-6" />
        </div>
        <div className="hidden lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6e0ad6]">
            Painel de Gestão
          </p>
          <h1 className="text-sm font-semibold text-slate-800">
            Bem-vindo{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#f78200] ring-2 ring-white" />
        </button>
        <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white px-2 py-1 pr-3 shadow-sm sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6e0ad6] to-[#A855F7] text-white">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="max-w-[160px] truncate text-xs font-semibold text-slate-800">
              {user?.email ?? "Admin"}
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              {isAdmin ? "Administrador" : "Anunciante"}
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
