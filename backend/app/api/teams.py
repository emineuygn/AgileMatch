from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, HrUser, load_conflicts, load_employees
from app.config import get_settings
from app.matching.engine import evaluate_team
from app.matching.solver import recommend_team
from app.models import Employee, Team, TeamMember
from app.schemas import (
    EmployeeOut,
    EvaluateRequest,
    TeamCreate,
    TeamEvaluation,
    TeamOut,
    TeamRecommendation,
    TeamRequest,
)

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("")
def list_teams(db: DbSession, _: HrUser) -> list[TeamOut]:
    query = (
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.sprints))
        .order_by(Team.created_at, Team.id)
    )
    return [TeamOut.model_validate(t) for t in db.scalars(query)]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_team(body: TeamCreate, db: DbSession, _: HrUser) -> TeamOut:
    member_ids = list(dict.fromkeys(body.member_ids))
    found = set(db.scalars(select(Employee.id).where(Employee.id.in_(member_ids))))
    missing = [m for m in member_ids if m not in found]
    if missing:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Bilinmeyen çalışanlar: {', '.join(missing)}")
    team = Team(
        id=f"t{uuid4().hex[:16]}",
        name=body.name,
        project=body.project,
        required_skills=body.required_skills,
        members=[TeamMember(employee_id=m, position=i) for i, m in enumerate(member_ids)],
    )
    db.add(team)
    db.commit()
    return TeamOut.model_validate(team)


@router.post("/evaluate")
def evaluate(body: EvaluateRequest, db: DbSession, _: HrUser) -> TeamEvaluation:
    by_id = {e.id: e for e in load_employees(db)}
    members = [by_id[m] for m in dict.fromkeys(body.member_ids) if m in by_id]
    return evaluate_team(members, body.required_skills, load_conflicts(db))


@router.post("/recommend")
def recommend(body: TeamRequest, db: DbSession, _: HrUser) -> TeamRecommendation:
    # Bu uçlar eşzamanlı (def): FastAPI bunları iş parçacığında çalıştırır, çözücü sunucuyu kilitlemez.
    pool: list[EmployeeOut] = load_employees(db)
    return recommend_team(pool, body, load_conflicts(db), get_settings().solver_time_limit_seconds)
