"""Yönetici hesabını ve demo verisini ekler. Tekrar çalıştırmak güvenlidir: dolu tabloya dokunmaz."""
import json
import secrets
from pathlib import Path

from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.models import ConflictPair, Employee, Sprint, Team, TeamMember, User
from app.security import hash_password

DATA_FILE = Path(__file__).with_name("demo_data.json")


def seed_admin(db) -> None:
    if db.scalar(select(User.id).limit(1)) is not None:
        return
    settings = get_settings()
    password = settings.admin_password
    if not password:
        password = secrets.token_urlsafe(12)
        print(f"ADMIN_PASSWORD tanımlı değil. Üretilen şifre ({settings.admin_email}): {password}")
    db.add(User(email=settings.admin_email.lower(), password_hash=hash_password(password), role="hr_manager"))


def seed_demo(db) -> None:
    if db.scalar(select(Employee.id).limit(1)) is not None:
        return
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    db.add_all(
        Employee(
            id=e["id"],
            email=f"{e['id']}@sirket.com",
            name=e["name"],
            title=e["title"],
            role=e["role"],
            department=e["department"],
            comm_style=e["commStyle"],
            skills=e["skills"],
            experience_years=e["experienceYears"],
            past_success=e["pastSuccess"],
            availability=e["availability"],
        )
        for e in data["employees"]
    )
    db.flush()
    db.add_all(ConflictPair(employee_a_id=a, employee_b_id=b) for a, b in data["conflictPairs"])
    for t in data["teams"]:
        db.add(
            Team(
                id=t["id"],
                name=t["name"],
                project=t["project"],
                required_skills=t["requiredSkills"],
                members=[TeamMember(employee_id=m, position=i) for i, m in enumerate(t["memberIds"])],
                sprints=[
                    Sprint(position=i, name=s["name"], completion=s["completion"], velocity=s["velocity"])
                    for i, s in enumerate(t["sprints"])
                ],
            )
        )


def main() -> None:
    with SessionLocal() as db:
        seed_admin(db)
        seed_demo(db)
        db.commit()


if __name__ == "__main__":
    main()
