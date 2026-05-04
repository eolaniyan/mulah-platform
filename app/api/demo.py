from __future__ import annotations

import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.transaction import Transaction
from app.models.subscription import Subscription
from app.services.transaction_ingestion import ingest_csv

router = APIRouter(prefix="/demo", tags=["Demo"])

SCENARIO_DIR = "data/sample_statements"
SCENARIO_MAP = {
    "healthy_finances": os.path.join(SCENARIO_DIR, "healthy_finances.csv"),
    "subscription_overload": os.path.join(SCENARIO_DIR, "subscription_overload.csv"),
    "financial_pressure": os.path.join(SCENARIO_DIR, "financial_pressure.csv"),
    "lifestyle_leak": os.path.join(SCENARIO_DIR, "lifestyle_leak.csv"),
}


@router.get("/scenarios")
def list_scenarios():
    return {"scenarios": list(SCENARIO_MAP.keys())}


@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    db.query(Subscription).delete()
    db.query(Transaction).delete()
    db.commit()
    return {"message": "Demo data reset successfully"}


@router.post("/load-scenario/{scenario_name}")
def load_scenario(scenario_name: str, db: Session = Depends(get_db)):
    file_path = SCENARIO_MAP.get(scenario_name)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Scenario not found")

    db.query(Subscription).delete()
    db.query(Transaction).delete()
    db.commit()

    result = ingest_csv(file_path=file_path, db=db)
    return {
        "scenario": scenario_name,
        "result": result,
    }