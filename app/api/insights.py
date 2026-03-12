from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.cfa_engine import generate_cfa_summary
from app.services.health_score_engine import calculate_health_score

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    return generate_cfa_summary(db)


@router.get("/health-score")
def get_health_score(db: Session = Depends(get_db)):
    summary = generate_cfa_summary(db)
    score = calculate_health_score(summary)
    return {
        "summary": summary,
        "health": score,
    }