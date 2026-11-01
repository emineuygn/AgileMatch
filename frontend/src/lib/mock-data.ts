// Backend hazır olana kadar kullanılan deterministik demo verisi.
import type { CommStyle, Employee, Role, Team } from "./types";

export const SKILLS = [
  "Python",
  "React",
  "TypeScript",
  "SQL",
  "DevOps",
  "Test",
  "UI/UX",
  "Scrum",
  "İş Analizi",
  "Makine Öğrenmesi",
] as const;

export const ROLES: Role[] = [
  "Product Owner",
  "Scrum Master",
  "Backend Geliştirici",
  "Frontend Geliştirici",
  "QA Mühendisi",
  "UI/UX Tasarımcı",
  "DevOps Mühendisi",
  "Veri Bilimci",
];

export const COMM_STYLES: CommStyle[] = ["Analitik", "Destekleyici", "Yönlendirici", "Dışadönük"];

const ROLE_PROFILE: Record<Role, { primary: string[]; department: string }> = {
  "Product Owner": { primary: ["İş Analizi", "Scrum"], department: "Ürün" },
  "Scrum Master": { primary: ["Scrum", "İş Analizi"], department: "Çevik Dönüşüm" },
  "Backend Geliştirici": { primary: ["Python", "SQL"], department: "Yazılım" },
  "Frontend Geliştirici": { primary: ["React", "TypeScript"], department: "Yazılım" },
  "QA Mühendisi": { primary: ["Test", "SQL"], department: "Kalite" },
  "UI/UX Tasarımcı": { primary: ["UI/UX", "React"], department: "Tasarım" },
  "DevOps Mühendisi": { primary: ["DevOps", "Python"], department: "Altyapı" },
  "Veri Bilimci": { primary: ["Makine Öğrenmesi", "Python"], department: "Veri" },
};

const FIRST_NAMES = [
  "Ayşe", "Mehmet", "Zeynep", "Can", "Elif", "Burak", "Selin", "Emre", "Deniz", "Merve",
  "Kerem", "Ece", "Oğuz", "Büşra", "Kaan", "İrem", "Mert", "Gizem", "Ali", "Derya",
  "Barış", "Nazlı", "Onur", "Sena", "Tolga", "Pelin", "Umut", "Cansu", "Serkan", "Damla",
  "Hakan", "Melis", "Yiğit", "Ebru", "Furkan", "Aslı", "Okan", "Tuğba", "Arda", "Şule",
];

const LAST_NAMES = [
  "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan",
  "Kılıç", "Aslan", "Koç", "Kurt", "Özdemir", "Polat", "Erdoğan", "Güneş", "Aksoy", "Tekin",
];

// Her rol için havuzdaki kişi sayısı (toplam 40)
const ROLE_COUNTS: [Role, number][] = [
  ["Product Owner", 4],
  ["Scrum Master", 4],
  ["Backend Geliştirici", 9],
  ["Frontend Geliştirici", 8],
  ["QA Mühendisi", 5],
  ["UI/UX Tasarımcı", 4],
  ["DevOps Mühendisi", 3],
  ["Veri Bilimci", 3],
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildEmployees(): Employee[] {
  const rand = mulberry32(42);
  const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const result: Employee[] = [];
  let i = 0;

  for (const [role, count] of ROLE_COUNTS) {
    for (let k = 0; k < count; k++, i++) {
      const profile = ROLE_PROFILE[role];
      const experienceYears = int(1, 14);
      const skills: Record<string, number> = {};
      for (const skill of SKILLS) {
        skills[skill] = profile.primary.includes(skill) ? int(3, 5) : int(1, 3);
      }
      const seniority = experienceYears >= 8 ? "Kıdemli " : experienceYears <= 2 ? "Yardımcı " : "";
      result.push({
        id: `e${String(i + 1).padStart(3, "0")}`,
        name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[int(0, LAST_NAMES.length - 1)]}`,
        title: `${seniority}${role}`,
        role,
        department: profile.department,
        commStyle: COMM_STYLES[int(0, COMM_STYLES.length - 1)],
        skills,
        experienceYears,
        pastSuccess: int(55, 96),
        availability: [100, 100, 80, 60, 40][int(0, 4)],
      });
    }
  }
  return result;
}

export const employees: Employee[] = buildEmployees();

/** Geçmiş projelerde uyuşmazlık kaydı olan çalışan çiftleri */
export const conflictPairs: [string, string][] = [
  ["e009", "e014"],
  ["e001", "e005"],
  ["e018", "e022"],
  ["e010", "e027"],
  ["e003", "e016"],
  ["e012", "e019"],
  ["e030", "e011"],
  ["e006", "e024"],
];

export const teams: Team[] = [
  {
    id: "t1",
    name: "Kartal",
    project: "Mobil Bankacılık Yenileme",
    memberIds: ["e001", "e005", "e009", "e010", "e018", "e026", "e031"],
    requiredSkills: ["Python", "React", "Test", "Scrum"],
    sprints: [
      { name: "S1", completion: 72, velocity: 28 },
      { name: "S2", completion: 78, velocity: 31 },
      { name: "S3", completion: 70, velocity: 29 },
      { name: "S4", completion: 84, velocity: 34 },
      { name: "S5", completion: 88, velocity: 36 },
    ],
  },
  {
    id: "t2",
    name: "Atlas",
    project: "İK Self-Servis Portalı",
    memberIds: ["e002", "e006", "e011", "e019", "e024", "e032"],
    requiredSkills: ["React", "TypeScript", "UI/UX"],
    sprints: [
      { name: "S1", completion: 65, velocity: 22 },
      { name: "S2", completion: 61, velocity: 21 },
      { name: "S3", completion: 58, velocity: 20 },
      { name: "S4", completion: 66, velocity: 23 },
      { name: "S5", completion: 63, velocity: 22 },
    ],
  },
  {
    id: "t3",
    name: "Pusula",
    project: "Talep Tahminleme Modeli",
    memberIds: ["e003", "e007", "e012", "e013", "e038", "e039"],
    requiredSkills: ["Python", "Makine Öğrenmesi", "SQL"],
    sprints: [
      { name: "S1", completion: 80, velocity: 25 },
      { name: "S2", completion: 85, velocity: 27 },
      { name: "S3", completion: 91, velocity: 30 },
      { name: "S4", completion: 89, velocity: 30 },
      { name: "S5", completion: 93, velocity: 32 },
    ],
  },
  {
    id: "t4",
    name: "Fener",
    project: "E-Ticaret Ödeme Altyapısı",
    memberIds: ["e004", "e008", "e014", "e020", "e027", "e035", "e036"],
    requiredSkills: ["Python", "DevOps", "SQL", "Test"],
    sprints: [
      { name: "S1", completion: 70, velocity: 26 },
      { name: "S2", completion: 74, velocity: 27 },
      { name: "S3", completion: 79, velocity: 29 },
      { name: "S4", completion: 76, velocity: 28 },
      { name: "S5", completion: 81, velocity: 30 },
    ],
  },
];
