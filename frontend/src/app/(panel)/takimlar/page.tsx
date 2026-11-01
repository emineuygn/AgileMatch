"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Avatar, Card, PageHeader, ProgressBar, RiskBadge, scoreColor } from "@/components/ui";
import { evaluateTeams, getEmployees, getTeams, type EvaluatedTeam } from "@/lib/api";

export default function TeamsPage() {
  const [rows, setRows] = useState<EvaluatedTeam[]>([]);

  useEffect(() => {
    Promise.all([getEmployees(), getTeams()])
      .then(([employees, teams]) => evaluateTeams(teams, employees))
      .then(setRows);
  }, []);

  return (
    <>
      <PageHeader title="Takımlar" description="Aktif takımların uyum skoru, riskleri ve sprint performansı" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {rows.map(({ team, members, evaluation }) => {
          const last = team.sprints.at(-1);
          return (
            <Card key={team.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{team.name}</h2>
                  <p className="text-sm text-slate-500">{team.project}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold tabular-nums" style={{ color: scoreColor(evaluation.score) }}>
                    {evaluation.score}
                  </p>
                  <p className="text-xs text-slate-500">uyum skoru</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {members.map((m) => (
                    <Avatar key={m.id} employee={m} size="sm" />
                  ))}
                </div>
                <RiskBadge level={evaluation.riskLevel} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {evaluation.factors.map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{f.label}</span>
                      <span className="tabular-nums">%{Math.round(f.value * 100)}</span>
                    </div>
                    <ProgressBar value={f.value * 100} className="mt-1 h-1.5" />
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Sprint tamamlanma (%)</span>
                  {last && (
                    <span>
                      Son sprint: <span className="font-medium text-slate-900">%{last.completion}</span> · hız{" "}
                      <span className="font-medium text-slate-900">{last.velocity}</span> SP
                    </span>
                  )}
                </div>
                {team.sprints.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Henüz tamamlanan sprint yok.</p>
                ) : (
                <div className="mt-2 h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={team.sprints} margin={{ left: -24, right: 8, top: 4 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="completion" name="Tamamlanma" stroke="#2563eb" strokeWidth={2} dot={{ r: 2.5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
