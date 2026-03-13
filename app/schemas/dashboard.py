from pydantic import BaseModel


class DashboardUploadResponse(BaseModel):
    uploaded: bool
    filename: str
    inserted: int
    detected_subscriptions: int