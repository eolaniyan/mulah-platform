from fastapi import FastAPI
from app.core.config import settings
from app.db.database import Base, engine
from app.api.transactions import router as transactions_router
from app.api.subscriptions import router as subscriptions_router
from app.api.insights import router as insights_router

# Create tables on startup for MVP simplicity
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.include_router(transactions_router)
app.include_router(subscriptions_router)
app.include_router(insights_router)


@app.get("/")
def root():
    return {
        "message": "Mulah Platform API is running",
        "environment": settings.APP_ENV,
    }