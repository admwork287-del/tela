import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full bg-[#f6f4fb]">
      {/* Decorative background mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#6e0ad6]/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-[#f78200]/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-indigo-400/10 blur-[120px]" />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
