# JSON alanları frontend'deki src/lib/types.ts ile birebir aynıdır (camelCase).
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

Role = Literal[
    "Product Owner",
    "Scrum Master",
    "Backend Geliştirici",
    "Frontend Geliştirici",
    "QA Mühendisi",
    "UI/UX Tasarımcı",
    "DevOps Mühendisi",
    "Veri Bilimci",
]
CommStyle = Literal["Analitik", "Destekleyici", "Yönlendirici", "Dışadönük"]
RiskLevel = Literal["Düşük", "Orta", "Yüksek"]
SkillName = Annotated[str, Field(min_length=1, max_length=60)]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class LoginRequest(CamelModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=256)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class EmployeeOut(CamelModel):
    id: str
    name: str
    title: str
    role: Role
    department: str
    comm_style: CommStyle
    skills: dict[str, int]
    experience_years: int
    past_success: float
    availability: int


class EmployeeCreate(CamelModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    title: str = Field(default="", max_length=120)
    role: Role
    department: str = Field(min_length=1, max_length=80)
    comm_style: CommStyle
    skills: dict[SkillName, Annotated[int, Field(ge=1, le=5)]] = Field(max_length=30)
    experience_years: int = Field(ge=0, le=60)
    past_success: float = Field(ge=0, le=100)
    availability: int = Field(ge=0, le=100)


class PairRisk(CamelModel):
    a: EmployeeOut
    b: EmployeeOut
    risk: float
    reasons: list[str]


class ScoreFactor(CamelModel):
    label: str
    value: float
    weight: float
    contribution: float
    hint: str


class SkillCoverage(CamelModel):
    skill: str
    level: int


class TeamEvaluation(CamelModel):
    score: int
    risk_level: RiskLevel
    avg_risk: float
    factors: list[ScoreFactor]
    skill_coverage: list[SkillCoverage]
    risky_pairs: list[PairRisk]


class TeamRequest(CamelModel):
    project_name: str = Field(max_length=160)
    slots: list[Role] = Field(max_length=40)
    required_skills: list[SkillName] = Field(max_length=30)


class EvaluateRequest(CamelModel):
    member_ids: list[str] = Field(max_length=40)
    required_skills: list[SkillName] = Field(max_length=30)


class TeamRecommendation(CamelModel):
    members: list[EmployeeOut]
    evaluation: TeamEvaluation
    warnings: list[str]


class SprintOut(CamelModel):
    name: str
    completion: float
    velocity: float


class TeamOut(CamelModel):
    id: str
    name: str
    project: str
    member_ids: list[str]
    required_skills: list[str]
    sprints: list[SprintOut]


class TeamCreate(CamelModel):
    name: str = Field(min_length=1, max_length=120)
    project: str = Field(min_length=1, max_length=160)
    member_ids: list[str] = Field(min_length=1, max_length=40)
    required_skills: list[SkillName] = Field(max_length=30)


class SurveyIn(CamelModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    comm_style: CommStyle
    skills: dict[SkillName, Annotated[int, Field(ge=1, le=5)]] = Field(max_length=30)
    # Açık rıza olmadan veri işlenmez (KVKK).
    consent: Literal[True]
