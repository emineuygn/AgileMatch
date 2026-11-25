import time

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession, HrUser, load_employees
from app.models import Employee
from app.schemas import EmployeeCreate, EmployeeOut

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("")
def list_employees(db: DbSession, _: HrUser) -> list[EmployeeOut]:
    return load_employees(db)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(body: EmployeeCreate, db: DbSession, _: HrUser) -> EmployeeOut:
    email = body.email.lower()
    if db.scalar(select(Employee.id).where(Employee.email == email)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu e-posta ile kayıtlı bir çalışan zaten var.")
    employee = Employee(
        # Zaman tabanlı kimlik: yeni kayıtlar listede demo verisinin ve birbirlerinin ardından sıralanır.
        id=f"e{time.time_ns() // 1000}",
        email=email,
        name=body.name.strip(),
        title=body.title.strip() or body.role,
        role=body.role,
        department=body.department.strip(),
        comm_style=body.comm_style,
        skills=body.skills,
        experience_years=body.experience_years,
        past_success=body.past_success,
        availability=body.availability,
    )
    db.add(employee)
    db.commit()
    return EmployeeOut.model_validate(employee)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, db: DbSession, _: HrUser) -> None:
    """KVKK veri silme talebi: çalışan, anket yanıtları ve takım üyelikleri silinir."""
    employee = db.get(Employee, employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Çalışan bulunamadı.")
    db.delete(employee)
    db.commit()
