from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.cfa_engine import generate_cfa_summary
from app.services.health_score_engine import calculate_health_score
from app.services.subscription_engine import run_recurring_analysis
from app.services.usw_summary_engine import build_usw_summary
from app.services.forecast_engine import build_forecast
from app.services.changes_engine import build_change_summary
from app.services.anomaly_engine import build_anomaly_flags
from app.services.insights_engine import build_insight_cards

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


@router.get("/usw-summary")
def get_usw_summary(db: Session = Depends(get_db)):
    analysis = run_recurring_analysis(db)
    return build_usw_summary(analysis)


@router.get("/forecast")
def get_forecast(db: Session = Depends(get_db)):
    analysis = run_recurring_analysis(db)
    return build_forecast(analysis)


@router.get("/changes")
def get_changes(db: Session = Depends(get_db)):
    return build_change_summary(db)


@router.get("/anomalies")
def get_anomalies(db: Session = Depends(get_db)):
    changes = build_change_summary(db)
    return build_anomaly_flags(changes)


@router.get("/cards")
def get_cards(db: Session = Depends(get_db)):
    summary = generate_cfa_summary(db)
    health = calculate_health_score(summary)
    analysis = run_recurring_analysis(db)
    usw_summary = build_usw_summary(analysis)
    forecast = build_forecast(analysis)
    changes = build_change_summary(db)
    anomalies = build_anomaly_flags(changes)

    return build_insight_cards(
        summary=summary,
        health=health,
        usw_summary=usw_summary,
        forecast=forecast,
        change_summary=changes,
        anomalies=anomalies,
    )


@router.get("/full-report")
def get_full_report(db: Session = Depends(get_db)):
    summary = generate_cfa_summary(db)
    health = calculate_health_score(summary)
    analysis = run_recurring_analysis(db)
    usw_summary = build_usw_summary(analysis)
    forecast = build_forecast(analysis)
    changes = build_change_summary(db)
    anomalies = build_anomaly_flags(changes)
    cards = build_insight_cards(
        summary=summary,
        health=health,
        usw_summary=usw_summary,
        forecast=forecast,
        change_summary=changes,
        anomalies=anomalies,
    )

    return {
        "summary": summary,
        "health": health,
        "analysis": analysis,
        "usw_summary": usw_summary,
        "forecast": forecast,
        "changes": changes,
        "anomalies": anomalies,
        "cards": cards,
    }