from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.main import app
from app.models import ConflictPair, Employee, TeamMember, User
from app.security import create_access_token, hash_password


def _employee_client(db, email="e001@sirket.com"):
    user = User(email=email, password_hash=hash_password("x"), role="employee")
    db.add(user)
    db.commit()
    return TestClient(app, headers={"Authorization": f"Bearer {create_access_token(user.id, user.role)}"})


SURVEY = {
    "name": "Ayşe",
    "email": "e001@sirket.com",
    "commStyle": "Destekleyici",
    "skills": {"Python": 5},
    "consent": True,
}


def test_login_rejects_bad_credentials(anon):
    assert anon.post("/auth/login", json={"email": "ik@sirket.com", "password": "yanlis"}).status_code == 401
    assert anon.post("/auth/login", json={"email": "yok@sirket.com", "password": "x"}).status_code == 401
    assert anon.post("/auth/login", json={"email": "ik@sirket.com", "password": "ş" * 100}).status_code == 401


def test_endpoints_require_token(anon):
    assert anon.get("/employees").status_code == 401
    assert anon.get("/teams").status_code == 401
    assert anon.post("/teams/recommend", json={}).status_code == 401
    assert anon.get("/employees", headers={"Authorization": "Bearer sahte"}).status_code == 401


def test_employee_role_cannot_read_hr_data(db):
    client = _employee_client(db)
    assert client.get("/employees").status_code == 403
    assert client.post("/teams/evaluate", json={"memberIds": [], "requiredSkills": []}).status_code == 403


def test_employee_json_matches_frontend_types(client):
    employees = client.get("/employees").json()
    assert len(employees) == 40
    assert set(employees[0]) == {
        "id", "name", "title", "role", "department", "commStyle", "skills",
        "experienceYears", "pastSuccess", "availability",
    }


def test_evaluation_json_matches_frontend_types(client):
    res = client.post("/teams/evaluate", json={"memberIds": ["e001", "e005"], "requiredSkills": ["Scrum"]}).json()
    assert set(res) == {"score", "riskLevel", "avgRisk", "factors", "skillCoverage", "riskyPairs"}
    assert set(res["riskyPairs"][0]) == {"a", "b", "risk", "reasons"}
    assert "commStyle" in res["riskyPairs"][0]["a"]


def test_create_team_and_list(client):
    res = client.post(
        "/teams",
        json={"name": "Yeni", "project": "Yeni", "memberIds": ["e001", "e002", "e001"], "requiredSkills": ["Scrum"]},
    )
    assert res.status_code == 201
    assert res.json()["memberIds"] == ["e001", "e002"] and res.json()["sprints"] == []
    assert any(t["id"] == res.json()["id"] for t in client.get("/teams").json())


def test_create_team_rejects_unknown_member(client):
    res = client.post("/teams", json={"name": "x", "project": "x", "memberIds": ["yok"], "requiredSkills": []})
    assert res.status_code == 422


def test_survey_updates_employee_profile(client, db):
    assert client.post("/surveys", json=SURVEY).status_code == 201
    employee = db.get(Employee, "e001")
    assert employee.comm_style == "Destekleyici"
    assert employee.skills["Python"] == 5
    assert employee.skills["Scrum"] == 5  # gönderilmeyen yetkinlik korunur


def test_survey_requires_consent_and_valid_values(client):
    assert client.post("/surveys", json={**SURVEY, "consent": False}).status_code == 422
    assert client.post("/surveys", json={**SURVEY, "skills": {"Python": 9}}).status_code == 422
    assert client.post("/surveys", json={**SURVEY, "commStyle": "Bilinmeyen"}).status_code == 422


def test_survey_unknown_email_is_404(client):
    assert client.post("/surveys", json={**SURVEY, "email": "yok@sirket.com"}).status_code == 404


def test_employee_can_only_submit_own_survey(db):
    client = _employee_client(db)
    assert client.post("/surveys", json=SURVEY).status_code == 201
    assert client.post("/surveys", json={**SURVEY, "email": "e002@sirket.com"}).status_code == 403


def test_delete_employee_removes_related_data(client, db):
    assert client.post("/surveys", json=SURVEY).status_code == 201
    assert client.delete("/employees/e001").status_code == 204
    assert db.get(Employee, "e001") is None
    assert db.scalar(select(func.count()).select_from(TeamMember).where(TeamMember.employee_id == "e001")) == 0
    assert db.scalar(select(func.count()).select_from(ConflictPair).where(ConflictPair.employee_a_id == "e001")) == 0
    assert client.delete("/employees/e001").status_code == 404
    assert all("e001" not in t["memberIds"] for t in client.get("/teams").json())


def test_cors_allows_only_configured_origin(anon):
    def preflight(origin):
        return anon.options(
            "/employees",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            },
        )

    assert preflight("https://agilematch.vercel.app").headers["access-control-allow-origin"] == "https://agilematch.vercel.app"
    assert "access-control-allow-origin" not in preflight("https://kotu-site.com").headers
