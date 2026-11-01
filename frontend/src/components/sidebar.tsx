"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ClipboardList, LayoutDashboard, LogOut, Menu, Network, Sparkles, Users, X } from "lucide-react";
import { isDemoMode, logout } from "@/lib/api";
import { cn } from "./ui";

const NAV = [
  { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/takim-kur", label: "Takım Kur", icon: Sparkles },
  { href: "/takimlar", label: "Takımlar", icon: Network },
  { href: "/calisanlar", label: "Çalışanlar", icon: Users },
  { href: "/anket", label: "Çalışan Anketi", icon: ClipboardList },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">AM</span>
      <span className="text-base font-semibold text-slate-900">AgileMatch</span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
      {isDemoMode && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Demo modu: örnek veri kullanılıyor.
        </p>
      )}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-medium text-slate-900">İK Yöneticisi</p>
          <p className="text-xs text-slate-500">ik@sirket.com</p>
        </div>
        <Link
          href="/giris"
          onClick={logout}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Çıkış yap"
        >
          <LogOut className="size-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Menüyü aç">
          <Menu className="size-5" />
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 border-r border-slate-200 bg-white p-4 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-slate-100 lg:hidden" aria-label="Menüyü kapat">
            <X className="size-5" />
          </button>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
