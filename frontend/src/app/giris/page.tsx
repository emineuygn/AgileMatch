"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { ApiError, isDemoMode, login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(isDemoMode ? "ik@sirket.com" : "");
  const [password, setPassword] = useState(isDemoMode ? "demo1234" : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sunucuya ulaşılamadı. Biraz sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-700">AM</span>
          <span className="text-lg font-semibold">AgileMatch</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight">
            Doğru insanlar,
            <br />
            doğru takımda.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Yetkinlikleri, iletişim tarzlarını ve geçmiş proje başarılarını analiz ederek en uyumlu Scrum takımlarını
            kurun. Uyuşmazlık risklerini ekip kurulmadan görün.
          </p>
        </div>
        <p className="text-sm text-brand-100">Çevik dönüşüm için akıllı takım kurulumu</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Giriş yap</h2>
            <p className="mt-1 text-sm text-slate-500">Yönetici paneline erişmek için giriş yapın.</p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">E-posta</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Şifre</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
          </Button>

          {isDemoMode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Demo modu: herhangi bir e-posta ve şifre ile giriş yapabilirsiniz.
            </p>
          )}

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            Kişisel veriler KVKK kapsamında, açık rıza ile ve şifrelenmiş olarak işlenir.
          </p>
        </form>
      </div>
    </div>
  );
}
