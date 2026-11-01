export type Role =
  | "Product Owner"
  | "Scrum Master"
  | "Backend Geliştirici"
  | "Frontend Geliştirici"
  | "QA Mühendisi"
  | "UI/UX Tasarımcı"
  | "DevOps Mühendisi"
  | "Veri Bilimci";

export type CommStyle = "Analitik" | "Destekleyici" | "Yönlendirici" | "Dışadönük";

export type RiskLevel = "Düşük" | "Orta" | "Yüksek";

export interface Employee {
  id: string;
  name: string;
  title: string;
  role: Role;
  department: string;
  commStyle: CommStyle;
  /** Yetkinlik adı -> 1..5 seviye */
  skills: Record<string, number>;
  experienceYears: number;
  /** Geçmiş projelerdeki başarı oranı, 0..100 */
  pastSuccess: number;
  /** Müsaitlik yüzdesi, 0..100 */
  availability: number;
}

export interface PairRisk {
  a: Employee;
  b: Employee;
  risk: number;
  reasons: string[];
}

export interface ScoreFactor {
  label: string;
  /** 0..1 arası ham değer */
  value: number;
  weight: number;
  /** Toplam skora katkı (puan) */
  contribution: number;
  hint: string;
}

export interface TeamEvaluation {
  score: number;
  riskLevel: RiskLevel;
  avgRisk: number;
  factors: ScoreFactor[];
  skillCoverage: { skill: string; level: number }[];
  riskyPairs: PairRisk[];
}

export interface TeamRequest {
  projectName: string;
  slots: Role[];
  requiredSkills: string[];
}

export interface TeamRecommendation {
  members: Employee[];
  evaluation: TeamEvaluation;
  warnings: string[];
}

export interface Sprint {
  name: string;
  completion: number;
  velocity: number;
}

export interface Team {
  id: string;
  name: string;
  project: string;
  memberIds: string[];
  requiredSkills: string[];
  sprints: Sprint[];
}
