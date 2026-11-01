from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, employees, surveys, teams
from app.config import get_settings

app = FastAPI(title="AgileMatch API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(teams.router)
app.include_router(surveys.router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
