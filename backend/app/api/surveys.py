from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models import Employee, SurveyResponse
from app.schemas import SurveyIn

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_survey(body: SurveyIn, db: DbSession, user: CurrentUser) -> dict[str, str]:
    email = body.email.lower()
    # Çalışan yalnızca kendi adına yanıt verebilir; başkasının profili değiştirilemez.
    if user.role != "hr_manager" and user.email != email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Yalnızca kendi anketinizi gönderebilirsiniz.")
    employee = db.scalar(select(Employee).where(Employee.email == email))
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bu e-posta ile kayıtlı çalışan bulunamadı.")

    employee.comm_style = body.comm_style
    employee.skills = {**employee.skills, **body.skills}
    db.add(
        SurveyResponse(
            employee_id=employee.id, comm_style=body.comm_style, skills=body.skills, consent=body.consent
        )
    )
    db.commit()
    return {"status": "ok"}
