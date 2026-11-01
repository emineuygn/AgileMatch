import type { ReactNode } from "react";
import type { CommStyle, Employee, RiskLevel } from "@/lib/types";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}

const RISK_STYLE: Record<RiskLevel, string> = {
  Düşük: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Orta: "bg-amber-50 text-amber-700 ring-amber-200",
  Yüksek: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", RISK_STYLE[level])}>
      {level} risk
    </span>
  );
}

export const STYLE_COLOR: Record<CommStyle, string> = {
  Analitik: "#2563eb",
  Destekleyici: "#10b981",
  Yönlendirici: "#f59e0b",
  Dışadönük: "#a855f7",
};

export function StyleBadge({ style }: { style: CommStyle }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      <span className="size-1.5 rounded-full" style={{ background: STYLE_COLOR[style] }} />
      {style}
    </span>
  );
}

const AVATAR_COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#4f46e5", "#0d9488"];

export function Avatar({ employee, size = "md" }: { employee: Employee; size?: "sm" | "md" }) {
  const initials = employee.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const color = AVATAR_COLORS[parseInt(employee.id.slice(1), 10) % AVATAR_COLORS.length];
  return (
    <span
      title={employee.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white",
        size === "sm" ? "size-7 text-[10px]" : "size-9 text-xs",
      )}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className="h-full rounded-full bg-brand-600 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}

export function scoreColor(score: number) {
  if (score >= 80) return "#059669";
  if (score >= 65) return "#2563eb";
  if (score >= 50) return "#d97706";
  return "#e11d48";
}

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="rounded-lg bg-brand-50 p-2 text-brand-600">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
