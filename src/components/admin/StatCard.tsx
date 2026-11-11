import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  label,
  value,
  className,
  valueClassName,
  icon: Icon,
  iconColor = "text-[#6e0ad6]",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-100 lg:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#6e0ad6]/10 to-[#f78200]/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl",
              valueClassName,
            )}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/60 ring-1 ring-purple-100",
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
      </div>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#6e0ad6] to-[#A855F7]" />
      </div>
    </div>
  );
}
