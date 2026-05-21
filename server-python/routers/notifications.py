from fastapi import APIRouter
from pydantic import BaseModel
from services.notification_service import notify_team_leader

router = APIRouter(prefix="/notify", tags=["Notifications"])

class JoinRequestPayload(BaseModel):
    teamId: int
    pitch: str
    skills: str
    github: str

@router.post("/join-request")
async def handle_join_request_notification(payload: JoinRequestPayload):
    """
    Webhook endpoint called by the Java backend when a new join request is created.
    """
    result = notify_team_leader(
        team_id=payload.teamId,
        pitch=payload.pitch,
        skills=payload.skills,
        github=payload.github
    )
    return result
