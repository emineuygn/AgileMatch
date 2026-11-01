"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Network, Sparkles, TriangleAlert, Users } from "lucide-react";
import { Card, CardHeader, PageHeader, RiskBadge, StatCard, STYLE_COLOR, scoreColor } from "@/components/ui";
import { evaluateTeams, getEmployees, getTeams, type EvaluatedTeam } from "@/lib/api";
import { COMM_STYLES } from "@/lib/mock-data";
import type { Employee, Team } from "@/lib/types";

const TEAM_LINE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#a855f7"];

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [evaluated, setEvaluated] = useState<EvaluatedTeam[]>([]);

  useEffect(() => {
    Promise.all([getEmployees(), getTeams()]).then(async ([employeeList, teamList]) => {
      setEmployees(employeeList);
      setTeams(teamList);
      setEvaluated(await evaluateTeams(teamList, employeeList));
    });
  }, []);

  const avgScore = evaluated.length
    ? Math.round(evaluated.reduce((s, x) => s + x.evaluation.score, 0) / evaluated.length)
    : 0;
  const highRisk = evaluated.filter((x) => x.evaluation.riskLevel !== "Düşük");

  const styleData = COMM_STYLES.map((s) => ({
    name: s,
    value: employees.filter((e) => e.commStyle === s).length,
  }));

  const sprintData = (teams[0]?.sprints ?? []).map((_, i) => {
    const row: Record<string, string | number> = { name: `Sprint ${i + 1}` };
    for (const t of teams) row[t.name] = t.sprints[i]?.completion ?? 0;
    return row;
  });

  const scoreData = evaluated.map((x) => ({ name: x.team.name, skor: x.evaluation.score }));

  return (
    <>
      <PageHeader
        title="Genel Bakış"
        description="Takımlarınızın uyum skorları, riskleri ve sprint performansı"
        action={
          <Link
            href="/takim-kur"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Sparkles className="size-4" /> Yeni takım kur
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam çalışan" value={employees.length} hint="Analize dahil edilen" icon={<Users className="size-4" />} />
        <StatCard label="Aktif takım" value={teams.length} hint="Devam eden projeler" icon={<Network className="size-4" />} />
        <StatCard label="Ortalama uyum skoru" value={`${avgScore}/100`} hint="Tüm aktif takımlar" icon={<Activity className="size-4" />} />
        <StatCard
          label="Dikkat gerektiren takım"
          value={highRisk.length}
          hint="Orta veya yüksek uyuşmazlık riski"
          icon={<TriangleAlert className="size-4" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sprint tamamlanma oranı (%)" subtitle="Son 5 sprint, takım bazında" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sprintData} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                {teams.map((t, i) => (
                  <Line
                    key={t.id}
                    type="monotone"
                    dataKey={t.name}
                    stroke={TEAM_LINE_COLORS[i % TEAM_LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 px-5 pb-4 text-xs text-slate-600">
            {teams.map((t, i) => (
              <span key={t.id} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: TEAM_LINE_COLORS[i % TEAM_LINE_COLORS.length] }} />
                {t.name}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="İletişim tarzı dağılımı" subtitle="Çalışan anketlerinden" />
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={styleData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {styleData.map((d) => (
                    <Cell key={d.name} fill={STYLE_COLOR[d.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 px-5 pb-5 text-xs text-slate-600">
            {styleData.map((d) => (
              <span key={d.name} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: STYLE_COLOR[d.name] }} />
                {d.name} <span className="ml-auto tabular-nums text-slate-900">{d.value}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Takım uyum skorları" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="skor" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {scoreData.map((d) => (
                    <Cell key={d.name} fill={scoreColor(d.skor)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Risk uyarıları" subtitle="Yapay zekâ motorunun tespit ettiği uyuşmazlık riskleri" />
          <ul className="divide-y divide-slate-100">
            {highRisk.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">Şu an riskli takım yok.</li>}
            {highRisk.map(({ team, evaluation }) => (
              <li key={team.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{team.name}</span>
                  <span className="text-sm text-slate-500">· {team.project}</span>
                  <span className="ml-auto">
                    <RiskBadge level={evaluation.riskLevel} />
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {evaluation.riskyPairs.slice(0, 3).map((p) => (
                    <li key={`${p.a.id}-${p.b.id}`}>
                      <span className="font-medium text-slate-800">
                        {p.a.name} – {p.b.name}
                      </span>
                      : {p.reasons.join(", ") || "Genel uyum düşük"}{" "}
                      <span className="tabular-nums text-slate-400">(%{Math.round(p.risk * 100)})</span>
                    </li>
                  ))}
                  {evaluation.riskyPairs.length === 0 && <li>Ortalama çift riski yüksek; iletişim tarzı dengesi önerilir.</li>}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
