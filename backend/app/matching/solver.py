"""OR-Tools CP-SAT ile rol kısıtları altında en yüksek uyum skorlu takımı arar."""
from collections import Counter
from math import comb

from ortools.sat.python import cp_model

from app.matching.engine import (
    WEIGHT_DIVERSITY,
    WEIGHT_HARMONY,
    WEIGHT_SKILL,
    WEIGHT_SUCCESS,
    ConflictSet,
    evaluate_team,
    pair_risk,
)
from app.schemas import EmployeeOut, TeamRecommendation, TeamRequest

MIN_AVAILABILITY = 50
# Her rol için çözücüye verilen en fazla aday: ihtiyacın 4 katı, en az bu kadar.
MIN_CANDIDATES_PER_ROLE = 12
# Skor ağırlıkları ondalıklı; CP-SAT tam sayı istediği için ölçeklenir.
SCALE = 10_000


def _shortlist(pool: list[EmployeeOut], need: int, required_skills: list[str]) -> list[EmployeeOut]:
    def relevance(e: EmployeeOut) -> float:
        fit = sum(e.skills.get(s, 0) for s in required_skills) / (5 * len(required_skills)) if required_skills else 0
        return fit + e.past_success / 100

    limit = max(need * 4, MIN_CANDIDATES_PER_ROLE)
    return sorted(pool, key=lambda e: (-relevance(e), e.id))[:limit]


def _greedy(by_role: dict[str, list[EmployeeOut]], needs: dict[str, int], skills: list[str], conflicts: ConflictSet):
    """Çözücüye başlangıç noktası ve zaman aşımında yedek olarak kullanılır."""
    chosen: list[EmployeeOut] = []
    for role, need in needs.items():
        for _ in range(need):
            candidates = [c for c in by_role[role] if c not in chosen]
            chosen.append(max(candidates, key=lambda c: evaluate_team([*chosen, c], skills, conflicts).score))
    return chosen


def _solve(
    candidates: list[EmployeeOut],
    needs: dict[str, int],
    skills: list[str],
    conflicts: ConflictSet,
    hint: list[EmployeeOut],
    time_limit: float,
) -> list[EmployeeOut] | None:
    size = sum(needs.values())
    model = cp_model.CpModel()
    x = {e.id: model.new_bool_var(f"x_{e.id}") for e in candidates}
    objective = []

    for role, need in needs.items():
        model.add(sum(x[e.id] for e in candidates if e.role == role) == need)

    # Yetkinlik: en yetkin üyenin seviyesi. y_k = "takımda seviyesi >= k olan biri var".
    if skills:
        coefficient = round(WEIGHT_SKILL * 100 * SCALE / (5 * len(skills)))
        for skill in skills:
            for level in range(1, 6):
                y = model.new_bool_var(f"y_{skill}_{level}")
                model.add(y <= sum(x[e.id] for e in candidates if e.skills.get(skill, 0) >= level))
                objective.append(coefficient * y)

    # İletişim uyumu: takım boyu sabit olduğundan ortalama risk çift riskleri toplamıdır.
    if size > 1:
        per_pair = WEIGHT_HARMONY * 100 * SCALE / comb(size, 2)
        for i, a in enumerate(candidates):
            for b in candidates[i + 1 :]:
                both = model.new_bool_var(f"p_{a.id}_{b.id}")
                model.add(both >= x[a.id] + x[b.id] - 1)
                objective.append(-round(per_pair * pair_risk(a, b, conflicts).risk) * both)

    for e in candidates:
        objective.append(round(WEIGHT_SUCCESS * SCALE * e.past_success / size) * x[e.id])

    # Tarz çeşitliliği
    for style in {e.comm_style for e in candidates}:
        present = model.new_bool_var(f"s_{style}")
        model.add(present <= sum(x[e.id] for e in candidates if e.comm_style == style))
        objective.append(round(WEIGHT_DIVERSITY * 100 * SCALE / min(4, size)) * present)

    model.maximize(sum(objective))

    hinted = {e.id for e in hint}
    for e in candidates:
        model.add_hint(x[e.id], e.id in hinted)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.num_workers = 4
    solver.parameters.random_seed = 42
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None
    return [e for e in candidates if solver.value(x[e.id])]


def recommend_team(
    pool: list[EmployeeOut], req: TeamRequest, conflicts: ConflictSet, time_limit: float = 2.0
) -> TeamRecommendation:
    available = [e for e in pool if e.availability >= MIN_AVAILABILITY]
    warnings: list[str] = []
    needs: dict[str, int] = {}
    by_role: dict[str, list[EmployeeOut]] = {}

    for role, need in Counter(req.slots).items():
        in_role = [e for e in available if e.role == role]
        if len(in_role) < need:
            warnings.append(
                f'"{role}" rolü için {need} kişi istendi, müsaitliği %{MIN_AVAILABILITY}+ olan {len(in_role)} kişi var.'
            )
        if in_role:
            needs[role] = min(need, len(in_role))
            by_role[role] = _shortlist(in_role, needs[role], req.required_skills)

    if not needs:
        return TeamRecommendation(
            members=[], evaluation=evaluate_team([], req.required_skills, conflicts), warnings=warnings
        )

    candidates = [e for group in by_role.values() for e in group]
    greedy = _greedy(by_role, needs, req.required_skills, conflicts)
    solved = _solve(candidates, needs, req.required_skills, conflicts, greedy, time_limit)

    best = greedy
    if solved is not None:
        solved_score = evaluate_team(solved, req.required_skills, conflicts).score
        if solved_score >= evaluate_team(greedy, req.required_skills, conflicts).score:
            best = solved
    return TeamRecommendation(
        members=best, evaluation=evaluate_team(best, req.required_skills, conflicts), warnings=warnings
    )
