"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createEmployee } from "@/lib/api";
import { COMM_STYLES, ROLES, SKILLS } from "@/lib/mock-data";
import type { CommStyle, Employee, Role } from "@/lib/types";
import { Button } from "./ui";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelClass = "text-sm font-medium text-slate-700";

export function EmployeeForm({ onClose, onCreated }: { onClose: () => void; onCreated: (employee: Employee) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(ROLES[0]);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [commStyle, setCommStyle] = useState<CommStyle>(COMM_STYLES[0]);
  const [experienceYears, setExperienceYears] = useState(1);
  const [pastSuccess, setPastSuccess] = useState(70);
  const [availability, setAvailability] = useState(100);
  const [skills, setSkills] = useState<Record<string, number>>(Object.fromEntries(SKILLS.map((s) => [s, 3])));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      onCreated(
        await createEmployee({
          name,
          email,
          role,
          title,
          department,
          commStyle,
          skills,
          experienceYears,
          pastSuccess,
          availability,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Çalışan eklenemedi.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8">
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Çalışan ekle"
        onSubmit={onSubmit}
        className="w-full max-w-2xl rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Çalışan ekle</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100" aria-label="Kapat">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Ad soyad</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Kurumsal e-posta</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Rol</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Unvan (isteğe bağlı)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={role} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Departman</span>
            <input required value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>İletişim tarzı</span>
            <select value={commStyle} onChange={(e) => setCommStyle(e.target.value as CommStyle)} className={inputClass}>
              {COMM_STYLES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Deneyim (yıl)</span>
            <input
              required
              type="number"
              min={0}
              max={60}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Geçmiş başarı (%)</span>
            <input
              required
              type="number"
              min={0}
              max={100}
              value={pastSuccess}
              onChange={(e) => setPastSuccess(Number(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Müsaitlik (%)</span>
            <input
              required
              type="number"
              min={0}
              max={100}
              value={availability}
              onChange={(e) => setAvailability(Number(e.target.value))}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-slate-500">%50 altındakiler takım önerisine dahil edilmez.</span>
          </label>
        </div>

        <div className="border-t border-slate-100 p-5">
          <p className={labelClass}>Yetkinlikler</p>
          <p className="text-xs text-slate-500">1 = başlangıç, 5 = uzman</p>
          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {SKILLS.map((skill) => (
              <label key={skill} className="block">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{skill}</span>
                  <span className="font-medium tabular-nums text-slate-900">{skills[skill]}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={skills[skill]}
                  onChange={(e) => setSkills((prev) => ({ ...prev, [skill]: Number(e.target.value) }))}
                  className="mt-1 w-full accent-brand-600"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
          {error && <p className="mr-auto text-sm text-rose-600">{error}</p>}
          <Button type="button" variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor..." : "Çalışanı ekle"}
          </Button>
        </div>
      </form>
    </div>
  );
}
