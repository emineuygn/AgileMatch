from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession, HrUser, load_employees
from app.models import Employee
from app.schemas import EmployeeOut

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("")
def list_employees(db: DbSession, _: HrUser) -> list[EmployeeOut]:
    return load_employees(db)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: str, db: DbSession, _: HrUser) -> None:
    """KVKK veri silme talebi: çalışan, anket yanıtları ve takım üyelikleri silinir."""
    employee = db.get(Employee, employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Çalışan bulunamadı.")
    db.delete(employee)
    db.commit()
