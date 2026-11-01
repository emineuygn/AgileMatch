import random
import time

import pytest

from app.matching.engine import evaluate_team
from app.matching.solver import recommend_team
from app.schemas import EmployeeOut, TeamRequest

SLOTS = [
    "Product Owner", "Scrum Master", "Backend Geliştirici", "Backend Geliştirici",
    "Frontend Geliştirici", "Frontend Geliştirici", "QA Mühendisi", "UI/UX Tasarımcı",
]
SKILLS = ["Python", "React", "Test", "Scrum"]


@pytest.mark.parametrize(
    "name,score,risk,risky_pairs",
    # Frontend'deki TypeScript motorunun aynı veri için verdiği sonuçlar.
    [("Kartal", 78, "Yüksek", 6), ("Atlas", 73, "Yüksek", 3), ("Pusula", 84, "Orta", 0), ("Fener", 87, "Düşük", 0)],
)
def test_scores_match_typescript_engine(client, name, score, risk, risky_pairs):
    team = next(t for t in client.get("/teams").json() if t["name"] == name)
    res = client.post(
        "/teams/evaluate", json={"memberIds": team["memberIds"], "requiredSkills": team["requiredSkills"]}
    ).json()
    assert (res["score"], res["riskLevel"], len(res["riskyPairs"])) == (score, risk, risky_pairs)


def test_recommendation_respects_constraints_and_beats_greedy(client):
    res = client.post("/teams/recommend", json={"projectName": "x", "slots": SLOTS, "requiredSkills": SKILLS}).json()
    members = res["members"]
    assert sorted(m["role"] for m in members) == sorted(SLOTS)
    assert len({m["id"] for m in members}) == len(SLOTS)
    assert all(m["availability"] >= 50 for m in members)
    # TypeScript'teki açgözlü motor bu istekte 90 buluyordu.
    assert res["evaluation"]["score"] >= 90
    assert res["warnings"] == []


def test_unfillable_role_gives_warning_and_partial_team(client):
    slots = ["Veri Bilimci"] * 6 + ["QA Mühendisi"]
    res = client.post("/teams/recommend", json={"projectName": "x", "slots": slots, "requiredSkills": []}).json()
    assert len(res["warnings"]) == 1 and "Veri Bilimci" in res["warnings"][0]
    assert any(m["role"] == "QA Mühendisi" for m in res["members"])


def test_empty_slots_returns_empty_team(client):
    res = client.post("/teams/recommend", json={"projectName": "x", "slots": [], "requiredSkills": SKILLS}).json()
    assert res["members"] == [] and res["evaluation"]["score"] == 0


def test_single_member_team(client):
    res = client.post(
        "/teams/recommend", json={"projectName": "x", "slots": ["Scrum Master"], "requiredSkills": ["Scrum"]}
    ).json()
    assert len(res["members"]) == 1


def _synthetic_pool(n: int) -> list[EmployeeOut]:
    rng = random.Random(7)
    roles = sorted(set(SLOTS))
    styles = ["Analitik", "Destekleyici", "Yönlendirici", "Dışadönük"]
    return [
        EmployeeOut(
            id=f"s{i}", name=f"Kişi {i}", title="-", role=roles[i % len(roles)], department="-",
            comm_style=rng.choice(styles), skills={s: rng.randint(1, 5) for s in SKILLS},
            experience_years=rng.randint(1, 14), past_success=rng.randint(55, 96), availability=100,
        )
        for i in range(n)
    ]


def test_500_employees_within_3_seconds():
    pool = _synthetic_pool(500)
    req = TeamRequest(project_name="x", slots=SLOTS, required_skills=SKILLS)
    started = time.perf_counter()
    result = recommend_team(pool, req, set())
    elapsed = time.perf_counter() - started
    assert elapsed < 3, f"{elapsed:.2f} sn sürdü"
    assert len(result.members) == len(SLOTS)
    assert evaluate_team(result.members, SKILLS, set()).score == result.evaluation.score
