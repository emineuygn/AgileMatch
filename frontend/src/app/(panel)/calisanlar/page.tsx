"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Avatar, Card, cn, PageHeader, ProgressBar, StyleBadge } from "@/components/ui";
import { getEmployees } from "@/lib/api";
import { COMM_STYLES, ROLES } from "@/lib/mock-data";
import type { CommStyle, Employee, Role } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function topSkills(e: Employee, n = 3) {
  return Object.entries(e.skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [style, setStyle] = useState<CommStyle | "">("");

  useEffect(() => {
    getEmployees().then(setEmployees);
  }, []);

  const q = query.toLocaleLowerCase("tr");
  const filtered = employees.filter(
    (e) =>
      (!role || e.role === role) &&
      (!style || e.commStyle === style) &&
      (e.name.toLocaleLowerCase("tr").includes(q) || e.department.toLocaleLowerCase("tr").includes(q)),
  );

  return (
    <>
      <PageHeader title="Çalışanlar" description="Yetkinlik, iletişim tarzı ve geçmiş başarı verileri" />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim veya departman ara..."
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value as Role | "")} className={cn(inputClass, "md:w-56")}>
            <option value="">Tüm roller</option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select value={style} onChange={(e) => setStyle(e.target.value as CommStyle | "")} className={cn(inputClass, "md:w-48")}>
            <option value="">Tüm iletişim tarzları</option>
            {COMM_STYLES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3">Çalışan</th>
                <th className="px-4 py-3">Departman</th>
                <th className="px-4 py-3">İletişim tarzı</th>
                <th className="px-4 py-3">Öne çıkan yetkinlikler</th>
                <th className="px-4 py-3 text-right">Deneyim</th>
                <th className="px-4 py-3">Geçmiş başarı</th>
                <th className="px-4 py-3 text-right">Müsaitlik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar employee={e} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900">{e.name}</p>
                        <p className="text-xs text-slate-500">{e.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.department}</td>
                  <td className="px-4 py-3">
                    <StyleBadge style={e.commStyle} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {topSkills(e).map(([skill, level]) => (
                        <span key={skill} className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">
                          {skill} <span className="tabular-nums opacity-70">{level}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{e.experienceYears} yıl</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={e.pastSuccess} className="w-20" />
                      <span className="tabular-nums text-xs text-slate-600">%{e.pastSuccess}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">%{e.availability}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Filtrelere uyan çalışan yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
