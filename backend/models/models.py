from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    messages: str
    session_ids: str
    history: List[dict] = []
    device_id: Optional[str] = None


class UrlRequest(BaseModel):
    url: str
    device_id: Optional[str] = None


class SessionRequest(BaseModel):
    device_id: Optional[str] = None


class DocInfo(BaseModel):
    id: str
    name: str
    type: str
    uploadedAt: str
    size: int
    source: str
    sourceUrl: Optional[str] = None
    device_id: Optional[str] = None
