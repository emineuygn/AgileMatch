// Frontend'in veri katmanı. NEXT_PUBLIC_API_URL tanımlıysa (ör. Render'daki FastAPI)
// istekler oraya gider; tanımlı değilse demo verisi ve tarayıcıdaki motor kullanılır.
import { evaluateTeam as localEvaluate, recommendTeam as localRecommend } from "./matching";
import { employees as mockEmployees, teams as mockTeams } from "./mock-data";
import type { Employee, Team, TeamEvaluation, TeamRecommendation, TeamRequest } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export const isDemoMode = !API_URL;

const TOKEN_KEY = "agilematch_token";

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401 && path !== "/auth/login") {
    // Oturum yok veya süresi doldu: girişe yönlendirilirken sayfa yarım veriyle hata vermesin.
    logout();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- bileşen dışı, tam yenileme istenir
    window.location.assign("/giris");
    return new Promise<T>(() => {});
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const fallback = res.status === 422 ? "Girilen bilgiler geçersiz." : `Sunucu hatası (${res.status})`;
    const detail = typeof body?.detail === "string" ? body.detail : fallback;
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<void> {
  let token = "demo-token";
  if (!isDemoMode) {
    const data = await request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    token = data.access_token;
  }
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function getEmployees(): Promise<Employee[]> {
  if (isDemoMode) return mockEmployees;
  return request<Employee[]>("/employees");
}

export type NewEmployee = Omit<Employee, "id"> & { email: string };

export async function createEmployee(employee: NewEmployee): Promise<Employee> {
  if (isDemoMode) {
    const created: Employee = { ...employee, title: employee.title || employee.role, id: `e${Date.now()}` };
    mockEmployees.push(created);
    return created;
  }
  return request<Employee>("/employees", { method: "POST", body: JSON.stringify(employee) });
}

export async function getTeams(): Promise<Team[]> {
  if (isDemoMode) return mockTeams;
  return request<Team[]>("/teams");
}

export async function recommendTeam(req: TeamRequest): Promise<TeamRecommendation> {
  if (isDemoMode) return localRecommend(mockEmployees, req);
  return request<TeamRecommendation>("/teams/recommend", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function evaluateTeam(members: Employee[], requiredSkills: string[]): Promise<TeamEvaluation> {
  if (isDemoMode) return localEvaluate(members, requiredSkills);
  return request<TeamEvaluation>("/teams/evaluate", {
    method: "POST",
    body: JSON.stringify({ memberIds: members.map((m) => m.id), requiredSkills }),
  });
}

export interface EvaluatedTeam {
  team: Team;
  members: Employee[];
  evaluation: TeamEvaluation;
}

export async function evaluateTeams(teams: Team[], employees: Employee[]): Promise<EvaluatedTeam[]> {
  const byId = new Map(employees.map((e) => [e.id, e]));
  return Promise.all(
    teams.map(async (team) => {
      const members = team.memberIds.map((id) => byId.get(id)).filter((e): e is Employee => !!e);
      return { team, members, evaluation: await evaluateTeam(members, team.requiredSkills) };
    }),
  );
}

export async function saveTeam(team: Omit<Team, "id" | "sprints">): Promise<Team> {
  if (isDemoMode) return { ...team, id: `t${Date.now()}`, sprints: [] };
  return request<Team>("/teams", { method: "POST", body: JSON.stringify(team) });
}

export interface SurveyAnswer {
  name: string;
  email: string;
  commStyle: string;
  skills: Record<string, number>;
  consent: boolean;
}

export async function submitSurvey(answer: SurveyAnswer): Promise<void> {
  if (isDemoMode) return;
  await request("/surveys", { method: "POST", body: JSON.stringify(answer) });
}
