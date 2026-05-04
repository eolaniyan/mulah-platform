from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.core.config import settings
from app.db.database import Base, engine
from app.api.transactions import router as transactions_router
from app.api.subscriptions import router as subscriptions_router
from app.api.insights import router as insights_router
from app.api.demo import router as demo_router
from app.models import *

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

app.include_router(transactions_router)
app.include_router(subscriptions_router)
app.include_router(insights_router)
app.include_router(demo_router)


@app.get("/")
def root():
    return {
        "message": "Mulah Platform API is running",
        "environment": settings.APP_ENV,
    }


@app.get("/dashboard")
def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})