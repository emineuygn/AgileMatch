from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(100))
    # "hr_manager" veya "employee"
    role: Mapped[str] = mapped_column(String(20), default="employee")


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(40), index=True)
    department: Mapped[str] = mapped_column(String(80))
    comm_style: Mapped[str] = mapped_column(String(20))
    skills: Mapped[dict[str, int]] = mapped_column(JSON)
    experience_years: Mapped[int] = mapped_column(Integer)
    past_success: Mapped[float] = mapped_column(Float)
    availability: Mapped[int] = mapped_column(Integer)


class ConflictPair(Base):
    """Geçmiş projelerde uyuşmazlık kaydı olan çalışan çifti."""

    __tablename__ = "conflict_pairs"

    employee_a_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
    employee_b_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    project: Mapped[str] = mapped_column(String(160))
    required_skills: Mapped[list[str]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    members: Mapped[list["TeamMember"]] = relationship(
        order_by="TeamMember.position", cascade="all, delete-orphan", passive_deletes=True
    )
    sprints: Mapped[list["Sprint"]] = relationship(
        order_by="Sprint.position", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def member_ids(self) -> list[str]:
        return [m.employee_id for m in self.members]


class TeamMember(Base):
    __tablename__ = "team_members"

    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, default=0)


class Sprint(Base):
    __tablename__ = "sprints"
    __table_args__ = (UniqueConstraint("team_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(40))
    completion: Mapped[float] = mapped_column(Float)
    velocity: Mapped[float] = mapped_column(Float)


class SurveyResponse(Base):
    """Anket yanıtı ve KVKK açık rıza kaydı."""

    __tablename__ = "survey_responses"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    comm_style: Mapped[str] = mapped_column(String(20))
    skills: Mapped[dict[str, int]] = mapped_column(JSON)
    consent: Mapped[bool] = mapped_column(Boolean)
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
