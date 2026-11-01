"use client";

import { useEffect, useState } from "react";
import { CircleCheck, GripVertical, Info, Minus, Plus, RotateCcw, Search, Sparkles, TriangleAlert, X } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  cn,
  PageHeader,
  ProgressBar,
  RiskBadge,
  scoreColor,
  StyleBadge,
} from "@/components/ui";
import { evaluateTeam, getEmployees, recommendTeam, saveTeam } from "@/lib/api";
import { evaluateTeam as evaluateLocally } from "@/lib/matching";
import { ROLES, SKILLS } from "@/lib/mock-data";
import type { Employee, Role, TeamEvaluation } from "@/lib/types";

const DEFAULT_SLOTS: Partial<Record<Role, number>> = {
  "Product Owner": 1,
  "Scrum Master": 1,
  "Backend Geliştirici": 2,
  "Frontend Geliştirici": 2,
  "QA Mühendisi": 1,
  "UI/UX Tasarımcı": 1,
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function TeamBuilderPage() {
  const [pool, setPool] = useState<Employee[]>([]);
  const [projectName, setProjectName] = useState("Müşteri Portalı v2");
  const [slotCounts, setSlotCounts] = useState<Partial<Record<Role, number>>>(DEFAULT_SLOTS);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(["Python", "React", "Test", "Scrum"]);
  const [team, setTeam] = useState<Employee[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [dragOver, setDragOver] = useState(false);
  const [evaluation, setEvaluation] = useState<TeamEvaluation>(() => evaluateLocally([], []));

  useEffect(() => {
    getEmployees().then(setPool);
  }, []);

  useEffect(() => {
    // Hızlı değişikliklerde eski isteğin yanıtı yenisinin üzerine yazmasın.
    let stale = false;
    evaluateTeam(team, requiredSkills)
      .then((result) => {
        if (!stale) setEvaluation(result);
      })
      .catch(errorToWarning);
    return () => {
      stale = true;
    };
  }, [team, requiredSkills]);

  const teamSize = Object.values(slotCounts).reduce((s, n) => s + (n ?? 0), 0);

  const filteredPool = pool.filter(
    (e) =>
      !team.some((m) => m.id === e.id) &&
      (!roleFilter || e.role === roleFilter) &&
      e.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")),
  );

  function errorToWarning(error: unknown) {
    setWarnings([error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu."]);
  }

  function changeSlot(role: Role, delta: number) {
    setSlotCounts((prev) => ({ ...prev, [role]: Math.max(0, Math.min(5, (prev[role] ?? 0) + delta)) }));
  }

  function toggleSkill(skill: string) {
    setRequiredSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  async function onRecommend() {
    setLoading(true);
    setSaved(false);
    const slots = ROLES.flatMap((r) => Array<Role>(slotCounts[r] ?? 0).fill(r));
    try {
      const result = await recommendTeam({ projectName, slots, requiredSkills });
      setTeam(result.members);
      setWarnings(result.warnings);
    } catch (error) {
      errorToWarning(error);
    } finally {
      setLoading(false);
    }
  }

  function addMember(e: Employee) {
    setSaved(false);
    setTeam((prev) => (prev.some((m) => m.id === e.id) ? prev : [...prev, e]));
  }

  function removeMember(id: string) {
    setSaved(false);
    setTeam((prev) => prev.filter((m) => m.id !== id));
  }

  function onDrop(ev: React.DragEvent) {
    ev.preventDefault();
    setDragOver(false);
    const emp = pool.find((p) => p.id === ev.dataTransfer.getData("text/plain"));
    if (emp) addMember(emp);
  }

  async function onSave() {
    try {
      await saveTeam({ name: projectName, project: projectName, memberIds: team.map((m) => m.id), requiredSkills });
      setSaved(true);
    } catch (error) {
      errorToWarning(error);
    }
  }

  return (
    <>
      <PageHeader
        title="Takım Kur"
        description="Proje ihtiyaçlarını belirleyin, yapay zekâ en uyumlu takımı önersin; dilerseniz sürükle-bırak ile düzenleyin."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
        {/* Proje gereksinimleri */}
        <Card className="h-fit">
          <CardHeader title="Proje gereksinimleri" />
          <div className="space-y-5 p-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Proje adı</span>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className={cn(inputClass, "mt-1")} />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Roller</span>
                <span className="text-xs text-slate-500">{teamSize} kişi</span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {ROLES.map((role) => (
                  <li key={role} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{role}</span>
                    <span className="flex items-center gap-1">
                      <button
                        onClick={() => changeSlot(role, -1)}
                        className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                        aria-label={`${role} azalt`}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center tabular-nums">{slotCounts[role] ?? 0}</span>
                      <button
                        onClick={() => changeSlot(role, 1)}
                        className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                        aria-label={`${role} artır`}
                      >
                        <Plus className="size-3" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-sm font-medium text-slate-700">Gerekli yetkinlikler</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SKILLS.map((skill) => {
                  const active = requiredSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        active
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button className="w-full" onClick={onRecommend} disabled={loading || teamSize === 0}>
              <Sparkles className="size-4" />
              {loading ? "Hesaplanıyor..." : "Yapay zekâ ile takım öner"}
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          {/* Takım + skor */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
            <Card>
              <CardHeader
                title={`Takım (${team.length})`}
                subtitle="Çalışanları havuzdan buraya sürükleyin veya + ile ekleyin"
                action={
                  team.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="ghost" className="whitespace-nowrap px-2 py-1 text-xs" onClick={() => setTeam([])}>
                        <RotateCcw className="size-3.5" /> Temizle
                      </Button>
                      <Button className="whitespace-nowrap px-3 py-1 text-xs" onClick={onSave} disabled={saved}>
                        {saved ? <><CircleCheck className="size-3.5" /> Kaydedildi</> : "Takımı kaydet"}
                      </Button>
                    </div>
                  )
                }
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  "m-4 min-h-48 rounded-lg border-2 border-dashed p-3 transition",
                  dragOver ? "border-brand-500 bg-brand-50" : "border-slate-200",
                )}
              >
                {warnings.length > 0 && (
                  <div className="mb-3 space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    {warnings.map((w) => (
                      <p key={w}>{w}</p>
                    ))}
                  </div>
                )}
                {team.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-slate-500">
                    <Sparkles className="mb-2 size-6 text-slate-300" />
                    Henüz üye yok. &quot;Yapay zekâ ile takım öner&quot; butonuna basın
                    <br />
                    veya havuzdan çalışan sürükleyin.
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-2">
                    {team.map((m) => {
                      const risky = evaluation.riskyPairs.some((p) => p.a.id === m.id || p.b.id === m.id);
                      return (
                        <li
                          key={m.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border bg-white p-2.5",
                            risky ? "border-amber-300" : "border-slate-200",
                          )}
                        >
                          <Avatar employee={m} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{m.name}</p>
                            <p className="truncate text-xs text-slate-500">{m.role}</p>
                          </div>
                          <span className="shrink-0">
                            <StyleBadge style={m.commStyle} />
                          </span>
                          <button
                            onClick={() => removeMember(m.id)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`${m.name} çıkar`}
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>

            <ScorePanel evaluation={evaluation} hasTeam={team.length > 0} />
          </div>

          {/* Çalışan havuzu */}
          <Card>
            <CardHeader title="Çalışan havuzu" subtitle={`${filteredPool.length} uygun çalışan`} />
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="İsim ara..."
                  className={cn(inputClass, "pl-9")}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | "")}
                className={cn(inputClass, "sm:w-56")}
              >
                <option value="">Tüm roller</option>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <ul className="grid max-h-[320px] grid-cols-1 gap-2 overflow-y-auto p-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredPool.map((e) => (
                <li
                  key={e.id}
                  draggable
                  onDragStart={(ev) => ev.dataTransfer.setData("text/plain", e.id)}
                  className="flex cursor-grab items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 hover:border-slate-300 active:cursor-grabbing"
                >
                  <GripVertical className="size-4 shrink-0 text-slate-300" />
                  <Avatar employee={e} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">{e.name}</p>
                      <span className="shrink-0">
                        <StyleBadge style={e.commStyle} />
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {e.role} · %{e.availability} müsait
                    </p>
                  </div>
                  <button
                    onClick={() => addMember(e)}
                    className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                    aria-label={`${e.name} ekle`}
                  >
                    <Plus className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Neden bu takım? */}
          {team.length > 1 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Neden bu skor?" subtitle="Her faktörün toplam skora katkısı" />
                <ul className="space-y-4 p-5">
                  {evaluation.factors.map((f) => (
                    <li key={f.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-slate-700" title={f.hint}>
                          {f.label}
                          <Info className="size-3.5 text-slate-400" />
                        </span>
                        <span className="tabular-nums text-slate-900">
                          +{f.contribution.toFixed(1)}
                          <span className="text-slate-400"> / {f.weight * 100}</span>
                        </span>
                      </div>
                      <ProgressBar value={f.value * 100} className="mt-1.5" />
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <CardHeader title="Uyuşmazlık riskleri" subtitle="Riski yüksek üye çiftleri" />
                <div className="p-5">
                  {evaluation.riskyPairs.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-emerald-700">
                      <CircleCheck className="size-4" /> Belirgin bir uyuşmazlık riski tespit edilmedi.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {evaluation.riskyPairs.map((p) => (
                        <li key={`${p.a.id}-${p.b.id}`} className="flex items-start gap-3 text-sm">
                          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {p.a.name} – {p.b.name}
                            </p>
                            <p className="text-xs text-slate-500">{p.reasons.join(", ")}</p>
                          </div>
                          <span className="tabular-nums text-sm font-medium text-rose-600">%{Math.round(p.risk * 100)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-medium text-slate-500">Yetkinlik karşılama</p>
                    <ul className="space-y-2">
                      {evaluation.skillCoverage.map((c) => (
                        <li key={c.skill} className="flex items-center gap-3 text-xs">
                          <span className="w-28 shrink-0 text-slate-600">{c.skill}</span>
                          <ProgressBar value={(c.level / 5) * 100} color={c.level >= 4 ? "#059669" : c.level >= 3 ? "#2563eb" : "#d97706"} />
                          <span className="w-6 text-right tabular-nums text-slate-900">{c.level}/5</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ScorePanel({ evaluation, hasTeam }: { evaluation: TeamEvaluation; hasTeam: boolean }) {
  const color = scoreColor(evaluation.score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <Card className="flex flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-medium text-slate-500">Takım uyum skoru</p>
      <div className="relative mt-3">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - (hasTeam ? evaluation.score : 0) / 100)}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold tabular-nums text-slate-900">
          {hasTeam ? evaluation.score : "–"}
        </span>
      </div>
      {hasTeam && (
        <div className="mt-3 space-y-2">
          <RiskBadge level={evaluation.riskLevel} />
          <p className="text-xs text-slate-500">Ortalama çift riski: %{Math.round(evaluation.avgRisk * 100)}</p>
        </div>
      )}
    </Card>
  );
}
