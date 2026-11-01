from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.matching.engine import ConflictSet
from app.models import ConflictPair, Employee, User
from app.schemas import EmployeeOut
from app.security import decode_user_id

bearer = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> User:
    user_id = decode_user_id(credentials.credentials) if credentials else None
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Giriş yapmanız gerekiyor.")
    return user


def require_hr(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != "hr_manager":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bu işlem için İK yöneticisi yetkisi gerekiyor.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
HrUser = Annotated[User, Depends(require_hr)]


def load_employees(db: Session) -> list[EmployeeOut]:
    rows = db.scalars(select(Employee).order_by(Employee.id))
    return [EmployeeOut.model_validate(e) for e in rows]


def load_conflicts(db: Session) -> ConflictSet:
    return {frozenset((c.employee_a_id, c.employee_b_id)) for c in db.scalars(select(ConflictPair))}
