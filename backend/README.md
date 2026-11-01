# AgileMatch Backend

FastAPI, SQLAlchemy, PostgreSQL ve OR-Tools. Yerelde `DATABASE_URL` verilmezse SQLite kullanılır.

## Yerelde çalıştırma

```bash
python3.13 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env          # JWT_SECRET ve ADMIN_PASSWORD değerlerini doldurun
.venv/bin/alembic upgrade head
.venv/bin/python -m scripts.seed_data
.venv/bin/uvicorn app.main:app --reload --port 8010
```

- API dokümantasyonu: http://localhost:8010/docs
- Testler: `.venv/bin/python -m pytest`
- Frontend'i bağlamak için `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8010`

## Uçlar

| Uç | Yetki | Açıklama |
|---|---|---|
| `POST /auth/login` | herkes | JWT döner |
| `GET /employees` | İK | Çalışan listesi |
| `DELETE /employees/{id}` | İK | KVKK veri silme: anket ve takım üyelikleri de silinir |
| `GET /teams`, `POST /teams` | İK | Takım listeleme ve kaydetme |
| `POST /teams/evaluate` | İK | Verilen üyelerin uyum skoru ve riskleri |
| `POST /teams/recommend` | İK | OR-Tools ile takım önerisi |
| `POST /surveys` | giriş yapmış | Anket; açık rıza zorunlu. Çalışan yalnızca kendi e-postasıyla gönderebilir |

## Eşleştirme motoru

- `app/matching/engine.py`: skor = yetkinlik %45, iletişim uyumu %30, geçmiş başarı %15, tarz çeşitliliği %10.
  `frontend/src/lib/matching.ts` ile aynı formüldür; formülü değiştirirseniz ikisini birlikte güncelleyin.
- `app/matching/solver.py`: müsaitliği %50 altında olanları eler, rol başına adayları kısaltır,
  sonra CP-SAT ile süre sınırı içinde en iyi takımı arar.

Demo verisi `scripts/demo_data.json` dosyasındadır. Demo çalışanların e-postası `e001@sirket.com` biçimindedir.
