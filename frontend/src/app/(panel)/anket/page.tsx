"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Button, Card, CardHeader, cn, PageHeader, StyleBadge } from "@/components/ui";
import { submitSurvey } from "@/lib/api";
import { COMM_STYLES, SKILLS } from "@/lib/mock-data";
import type { CommStyle } from "@/lib/types";

const QUESTIONS: { q: string; options: { text: string; style: CommStyle }[] }[] = [
  {
    q: "Yeni bir göreve başlarken ilk ne yaparsınız?",
    options: [
      { text: "Detayları ve verileri incelerim", style: "Analitik" },
      { text: "Ekibin ihtiyaçlarını dinlerim", style: "Destekleyici" },
      { text: "Hedefi ve planı belirlerim", style: "Yönlendirici" },
      { text: "Fikirleri herkesle tartışırım", style: "Dışadönük" },
    ],
  },
  {
    q: "Toplantılarda genellikle hangi roldesiniz?",
    options: [
      { text: "Soruları sorarım, tutarlılığı kontrol ederim", style: "Analitik" },
      { text: "Herkesin söz almasını sağlarım", style: "Destekleyici" },
      { text: "Kararı netleştirir, aksiyon atarım", style: "Yönlendirici" },
      { text: "Enerji verir, yeni fikirler öneririm", style: "Dışadönük" },
    ],
  },
  {
    q: "Ekipte anlaşmazlık çıktığında ne yaparsınız?",
    options: [
      { text: "Verilere dayalı en mantıklı çözümü ararım", style: "Analitik" },
      { text: "Ortamı yumuşatır, uzlaşma ararım", style: "Destekleyici" },
      { text: "Hızlıca karar verip ilerlemeyi tercih ederim", style: "Yönlendirici" },
      { text: "Açıkça konuşup tartışmayı severim", style: "Dışadönük" },
    ],
  },
  {
    q: "Geri bildirimi nasıl almayı tercih edersiniz?",
    options: [
      { text: "Yazılı, somut örneklerle", style: "Analitik" },
      { text: "Birebir ve yapıcı bir dille", style: "Destekleyici" },
      { text: "Kısa ve doğrudan", style: "Yönlendirici" },
      { text: "Sohbet havasında, anlık", style: "Dışadönük" },
    ],
  },
];

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function SurveyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<(CommStyle | null)[]>(QUESTIONS.map(() => null));
  const [skills, setSkills] = useState<Record<string, number>>(Object.fromEntries(SKILLS.map((s) => [s, 3])));
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<CommStyle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const complete = name && email && consent && answers.every(Boolean);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const counts = COMM_STYLES.map((s) => ({ s, n: answers.filter((a) => a === s).length }));
    const style = counts.sort((a, b) => b.n - a.n)[0].s;
    setError(null);
    try {
      await submitSurvey({ name, email, commStyle: style, skills, consent });
      setResult(style);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anket gönderilemedi.");
    }
  }

  if (result) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <CircleCheck className="mx-auto size-10 text-emerald-600" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Teşekkürler, {name.split(" ")[0]}!</h1>
        <p className="mt-2 text-sm text-slate-500">Yanıtlarınız kaydedildi. Baskın iletişim tarzınız:</p>
        <div className="mt-3 flex justify-center">
          <StyleBadge style={result} />
        </div>
        <Button variant="secondary" className="mt-6" onClick={() => setResult(null)}>
          Yanıtları düzenle
        </Button>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Çalışan Anketi"
        description="İletişim tarzınızı ve yetkinliklerinizi paylaşın. Takım önerileri bu verilerle hesaplanır."
      />
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader title="Bilgileriniz" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Ad soyad</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Kurumsal e-posta</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </label>
          </div>
        </Card>

        <Card>
          <CardHeader title="İletişim tarzı" subtitle="Size en yakın seçeneği işaretleyin" />
          <div className="space-y-6 p-5">
            {QUESTIONS.map((question, qi) => (
              <fieldset key={question.q}>
                <legend className="text-sm font-medium text-slate-800">
                  {qi + 1}. {question.q}
                </legend>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {question.options.map((o) => {
                    const selected = answers[qi] === o.style;
                    return (
                      <label
                        key={o.text}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                          selected ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 hover:border-slate-300",
                        )}
                      >
                        <input
                          type="radio"
                          name={`q${qi}`}
                          checked={selected}
                          onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? o.style : a)))}
                          className="accent-brand-600"
                        />
                        {o.text}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Yetkinlik öz değerlendirmesi" subtitle="1 = başlangıç, 5 = uzman" />
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
            {SKILLS.map((skill) => (
              <label key={skill} className="block">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{skill}</span>
                  <span className="tabular-nums font-medium text-slate-900">{skills[skill]}</span>
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
        </Card>

        <Card className="p-5">
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 accent-brand-600"
            />
            <span>
              Kişisel verilerimin, takım oluşturma amacıyla 6698 sayılı KVKK kapsamında işlenmesine açık rıza veriyorum.
              Verilerimin silinmesini dilediğim zaman talep edebilirim.
            </span>
          </label>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={!complete}>
            Anketi gönder
          </Button>
        </div>
      </form>
    </>
  );
}
