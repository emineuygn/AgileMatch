"""Uyum skoru ve uyuşmazlık riski. Formül frontend'deki src/lib/matching.ts ile aynıdır."""
import math

from app.schemas import (
    EmployeeOut,
    PairRisk,
    RiskLevel,
    ScoreFactor,
    SkillCoverage,
    TeamEvaluation,
)

STYLE_FRICTION: dict[str, dict[str, float]] = {
    "Analitik": {"Analitik": 0.15, "Destekleyici": 0.1, "Yönlendirici": 0.35, "Dışadönük": 0.4},
    "Destekleyici": {"Analitik": 0.1, "Destekleyici": 0.1, "Yönlendirici": 0.2, "Dışadönük": 0.15},
    "Yönlendirici": {"Analitik": 0.35, "Destekleyici": 0.2, "Yönlendirici": 0.6, "Dışadönük": 0.3},
    "Dışadönük": {"Analitik": 0.4, "Destekleyici": 0.15, "Yönlendirici": 0.3, "Dışadönük": 0.25},
}

WEIGHT_SKILL = 0.45
WEIGHT_HARMONY = 0.3
WEIGHT_SUCCESS = 0.15
WEIGHT_DIVERSITY = 0.1

ConflictSet = set[frozenset[str]]


def pair_risk(a: EmployeeOut, b: EmployeeOut, conflicts: ConflictSet) -> PairRisk:
    reasons: list[str] = []
    risk = STYLE_FRICTION[a.comm_style][b.comm_style]
    if risk >= 0.35:
        reasons.append(f"{a.comm_style} – {b.comm_style} iletişim tarzı sürtünmesi")
    if frozenset((a.id, b.id)) in conflicts:
        risk += 0.35
        reasons.append("Geçmiş projede uyuşmazlık kaydı")
    if abs(a.experience_years - b.experience_years) >= 10:
        risk += 0.05
        reasons.append("Büyük kıdem farkı")
    return PairRisk(a=a, b=b, risk=min(1.0, max(0.0, risk)), reasons=reasons)


def risk_level_of(avg_risk: float, max_pair_risk: float) -> RiskLevel:
    if avg_risk >= 0.4 or max_pair_risk >= 0.75:
        return "Yüksek"
    if avg_risk >= 0.25 or max_pair_risk >= 0.5:
        return "Orta"
    return "Düşük"


def evaluate_team(
    members: list[EmployeeOut], required_skills: list[str], conflicts: ConflictSet
) -> TeamEvaluation:
    coverage = [
        SkillCoverage(skill=s, level=max((m.skills.get(s, 0) for m in members), default=0))
        for s in required_skills
    ]
    skill_fit = sum(c.level / 5 for c in coverage) / len(coverage) if coverage else 0.0

    pairs = [
        pair_risk(members[i], members[j], conflicts)
        for i in range(len(members))
        for j in range(i + 1, len(members))
    ]
    avg_risk = sum(p.risk for p in pairs) / len(pairs) if pairs else 0.0
    max_pair_risk = max((p.risk for p in pairs), default=0.0)

    success = sum(m.past_success for m in members) / len(members) / 100 if members else 0.0
    diversity = len({m.comm_style for m in members}) / min(4, len(members)) if members else 0.0

    raw = [
        ("Yetkinlik uyumu", skill_fit, WEIGHT_SKILL, "Gerekli yetkinliklerin takımda karşılanma düzeyi"),
        (
            "İletişim uyumu",
            1 - avg_risk if len(members) > 1 else 0.0,
            WEIGHT_HARMONY,
            "Üye çiftleri arasındaki ortalama uyuşmazlık riskinin tersi",
        ),
        ("Geçmiş başarı", success, WEIGHT_SUCCESS, "Üyelerin önceki projelerdeki başarı ortalaması"),
        ("Tarz çeşitliliği", diversity, WEIGHT_DIVERSITY, "Farklı iletişim tarzlarının dengeli dağılımı"),
    ]
    factors = [
        ScoreFactor(label=label, value=value, weight=weight, contribution=value * weight * 100, hint=hint)
        for label, value, weight, hint in raw
    ]
    return TeamEvaluation(
        # Python'un round'u .5'i çifte yuvarlar; JS Math.round ile aynı sonuç için floor.
        score=math.floor(sum(f.contribution for f in factors) + 0.5),
        risk_level=risk_level_of(avg_risk, max_pair_risk),
        avg_risk=avg_risk,
        factors=factors,
        skill_coverage=coverage,
        risky_pairs=sorted((p for p in pairs if p.risk >= 0.45), key=lambda p: -p.risk),
    )
