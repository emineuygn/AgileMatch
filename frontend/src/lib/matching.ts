// Tarayıcı tarafında çalışan basit eşleştirme motoru.
// Python/FastAPI motoru hazır olduğunda aynı arayüzle backend'e taşınacak.
import { conflictPairs } from "./mock-data";
import type {
  CommStyle,
  Employee,
  PairRisk,
  RiskLevel,
  TeamEvaluation,
  TeamRecommendation,
  TeamRequest,
} from "./types";

const STYLE_FRICTION: Record<CommStyle, Record<CommStyle, number>> = {
  Analitik: { Analitik: 0.15, Destekleyici: 0.1, Yönlendirici: 0.35, Dışadönük: 0.4 },
  Destekleyici: { Analitik: 0.1, Destekleyici: 0.1, Yönlendirici: 0.2, Dışadönük: 0.15 },
  Yönlendirici: { Analitik: 0.35, Destekleyici: 0.2, Yönlendirici: 0.6, Dışadönük: 0.3 },
  Dışadönük: { Analitik: 0.4, Destekleyici: 0.15, Yönlendirici: 0.3, Dışadönük: 0.25 },
};

const WEIGHTS = { skill: 0.45, harmony: 0.3, success: 0.15, diversity: 0.1 };

const conflictSet = new Set(conflictPairs.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function pairRisk(a: Employee, b: Employee): PairRisk {
  const reasons: string[] = [];
  let risk = STYLE_FRICTION[a.commStyle][b.commStyle];
  if (risk >= 0.35) reasons.push(`${a.commStyle} – ${b.commStyle} iletişim tarzı sürtünmesi`);
  if (conflictSet.has(`${a.id}|${b.id}`)) {
    risk += 0.35;
    reasons.push("Geçmiş projede uyuşmazlık kaydı");
  }
  if (Math.abs(a.experienceYears - b.experienceYears) >= 10) {
    risk += 0.05;
    reasons.push("Büyük kıdem farkı");
  }
  return { a, b, risk: clamp(risk), reasons };
}

export function riskLevelOf(avgRisk: number, maxPairRisk: number): RiskLevel {
  if (avgRisk >= 0.4 || maxPairRisk >= 0.75) return "Yüksek";
  if (avgRisk >= 0.25 || maxPairRisk >= 0.5) return "Orta";
  return "Düşük";
}

export function evaluateTeam(members: Employee[], requiredSkills: string[]): TeamEvaluation {
  const skillCoverage = requiredSkills.map((skill) => ({
    skill,
    level: members.length ? Math.max(...members.map((m) => m.skills[skill] ?? 0)) : 0,
  }));
  const skillFit = skillCoverage.length
    ? skillCoverage.reduce((s, c) => s + c.level / 5, 0) / skillCoverage.length
    : 0;

  const pairs: PairRisk[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) pairs.push(pairRisk(members[i], members[j]));
  }
  const avgRisk = pairs.length ? pairs.reduce((s, p) => s + p.risk, 0) / pairs.length : 0;
  const maxPairRisk = pairs.reduce((m, p) => Math.max(m, p.risk), 0);

  const success = members.length
    ? members.reduce((s, m) => s + m.pastSuccess, 0) / members.length / 100
    : 0;
  const diversity = members.length
    ? new Set(members.map((m) => m.commStyle)).size / Math.min(4, members.length)
    : 0;

  const raw = [
    { label: "Yetkinlik uyumu", value: skillFit, weight: WEIGHTS.skill, hint: "Gerekli yetkinliklerin takımda karşılanma düzeyi" },
    { label: "İletişim uyumu", value: members.length > 1 ? 1 - avgRisk : 0, weight: WEIGHTS.harmony, hint: "Üye çiftleri arasındaki ortalama uyuşmazlık riskinin tersi" },
    { label: "Geçmiş başarı", value: success, weight: WEIGHTS.success, hint: "Üyelerin önceki projelerdeki başarı ortalaması" },
    { label: "Tarz çeşitliliği", value: diversity, weight: WEIGHTS.diversity, hint: "Farklı iletişim tarzlarının dengeli dağılımı" },
  ];
  const factors = raw.map((f) => ({ ...f, contribution: f.value * f.weight * 100 }));
  const score = Math.round(factors.reduce((s, f) => s + f.contribution, 0));

  return {
    score,
    riskLevel: riskLevelOf(avgRisk, maxPairRisk),
    avgRisk,
    factors,
    skillCoverage,
    riskyPairs: pairs.filter((p) => p.risk >= 0.45).sort((x, y) => y.risk - x.risk),
  };
}

/** Rol slotlarını açgözlü seçimle doldurur, ardından takas ile iyileştirir. */
export function recommendTeam(pool: Employee[], req: TeamRequest): TeamRecommendation {
  const available = pool.filter((e) => e.availability >= 50);
  const warnings: string[] = [];
  const chosen: (Employee | null)[] = [];

  const scoreOf = (list: (Employee | null)[]) =>
    evaluateTeam(list.filter((e): e is Employee => e !== null), req.requiredSkills).score;

  for (const role of req.slots) {
    const candidates = available.filter((e) => e.role === role && !chosen.includes(e));
    if (!candidates.length) {
      warnings.push(`"${role}" rolü için uygun (müsaitliği %50+) çalışan bulunamadı.`);
      chosen.push(null);
      continue;
    }
    let best = candidates[0];
    let bestScore = -1;
    for (const c of candidates) {
      const s = scoreOf([...chosen, c]);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    chosen.push(best);
  }

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < chosen.length; i++) {
      const current = chosen[i];
      if (!current) continue;
      let bestScore = scoreOf(chosen);
      for (const c of available) {
        if (c.role !== current.role || chosen.includes(c)) continue;
        const trial = [...chosen];
        trial[i] = c;
        const s = scoreOf(trial);
        if (s > bestScore) {
          bestScore = s;
          chosen[i] = c;
        }
      }
    }
  }

  const members = chosen.filter((e): e is Employee => e !== null);
  return { members, evaluation: evaluateTeam(members, req.requiredSkills), warnings };
}
