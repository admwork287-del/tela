import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Package,
  Eye,
  Plus,
  Settings,
  DollarSign,
  User,
  Star,
  MessageCircle,
  LogIn,
  ChevronDown,
  X,
  LogOut,
  CreditCard,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/admin";
import olxLogo from "@/assets/olx-logo.png";

interface Item {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: Item[];
}
interface Section {
  title: string;
  items: Item[];
  adminOnly?: boolean;
}

const sections: Section[] = [
  {
    title: "DASHBOARD",
    items: [
      { name: "Tela Principal", href: "/painel", icon: Home },
      {
        name: "Produtos",
        href: "/painel/produtos",
        icon: Package,
        children: [
          { name: "Ver Produtos", href: "/painel/produtos", icon: Eye },
          { name: "Cadastrar Produtos", href: "/painel/produtos/novo", icon: Plus },
        ],
      },
      {
        name: "Configurações",
        href: "/painel/configuracoes",
        icon: Settings,
        children: [
          { name: "Pix", href: "/painel/configuracoes", icon: DollarSign },
          { name: "Cartão", href: "/painel/configuracoes/cartao", icon: CreditCard },
          { name: "Anunciante", href: "/painel/anunciante", icon: User },
        ],
      },
    ],
  },
  {
    title: "AVALIAÇÕES",
    items: [{ name: "Gerenciar", href: "/painel/avaliacoes", icon: Star }],
  },
  {
    title: "CHAT",
    items: [{ name: "Chat", href: "/painel/chat", icon: MessageCircle }],
  },
  {
    title: "LOGINS",
    items: [{ name: "Registro de Logins", href: "/painel/logins", icon: LogIn }],
  },
  {
    title: "PAGAMENTOS",
    items: [{ name: "Cartões", href: "/painel/cartoes", icon: CreditCard }],
  },
  {
    title: "ENTREGAS",
    items: [{ name: "Rastreios", href: "/painel/rastreios", icon: Truck }],
  },
  {
    title: "ADMINISTRAÇÃO",
    adminOnly: true,
    items: [{ name: "Usuários", href: "/painel/usuarios", icon: Users }],
  },

];

function SidebarLink({
  item,
  depth = 0,
  onNavigate,
}: {
  item: Item;
  depth?: number;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(
    item.children?.some((c) => pathname === c.href) ?? false,
  );
  const isActive = pathname === item.href;

  if (item.children?.length) {
    return (
      <div>
        <div
          className={cn(
            "group mx-2 flex items-center justify-between rounded-xl pr-1 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100/70 hover:text-slate-900",
            (open || isActive) && "bg-slate-100/60 text-slate-900",
          )}
          style={{ width: "calc(100% - 16px)" }}
        >
          <Link
            to={item.href}
            onClick={() => {
              setOpen(true);
              onNavigate?.();
            }}
            className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                open || isActive
                  ? "bg-purple-100 text-[#6e0ad6]"
                  : "bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-[#6e0ad6]",
              )}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <span>{item.name}</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label={open ? "Recolher" : "Expandir"}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>
        {open && (
          <div className="my-1.5 ml-7 space-y-0.5 border-l-2 border-purple-100 pl-3">
            {item.children.map((c) => (
              <SidebarLink
                key={c.name + c.href}
                item={c}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative mx-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        depth > 0 && "py-2 pl-3",
        isActive
          ? "bg-gradient-to-r from-[#6e0ad6] to-[#A855F7] text-white shadow-md shadow-purple-300/50"
          : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
      )}
      style={{ width: "calc(100% - 16px)" }}
    >
      {isActive && (
        <span className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#f78200]" />
      )}
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
          depth > 0 && "h-7 w-7",
          isActive
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-[#6e0ad6]",
        )}
      >
        <item.icon className={cn("h-4 w-4", depth > 0 && "h-3.5 w-3.5")} />
      </div>
      <span className="truncate">{item.name}</span>
    </Link>
  );
}

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const { isAdmin } = useUserRole();
  return (
    <aside className="relative flex h-full w-72 flex-col overflow-hidden border-r border-slate-200/70 bg-white text-slate-800">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#6e0ad6] via-[#A855F7] to-[#f78200] opacity-70" />

      <div className="relative flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-xl bg-gradient-to-br from-[#6e0ad6] to-[#A855F7] p-2 shadow-md shadow-purple-200">
            <img src={olxLogo} alt="OLX" className="h-5 brightness-0 invert" />
          </div>
          <div className="min-w-0">
            <span className="block text-[15px] font-bold tracking-tight text-slate-900">Painel OLX</span>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Área de Gestão</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto py-5">
        {sections
          .filter((section) => !section.adminOnly || isAdmin)
          .map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 px-6 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {section.title}
              </h2>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.name + item.href}
                    item={item}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
      </nav>

      <div className="border-t border-slate-100 bg-slate-50/60 p-3">
        <button
          onClick={async () => {
            onClose?.();
            const { authActions } = await import("@/hooks/admin");
            await authActions.signOut();
            window.location.href = "/auth";
          }}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
        >
          <div className="rounded-lg bg-white p-2 text-slate-500 ring-1 ring-slate-200 transition-all group-hover:bg-red-100 group-hover:text-red-600 group-hover:ring-red-200">
            <LogOut className="h-4 w-4" />
          </div>
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
