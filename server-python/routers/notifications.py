import os
import hmac
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status # Added status import
from pydantic import BaseModel
from services.notification_service import notify_team_leader

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notify", tags=["Notifications"])

class JoinRequestPayload(BaseModel):
    teamId: int
    pitch: str
    skills: str
    github: str

# FIX ISSUE 4 ONLY: Create response layout schema contract
class NotificationResponse(BaseModel):
    status: str
    detail: Optional[str] = None

INTERNAL_SERVICE_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "")


def _verify_service_auth(x_service_auth: Optional[str] = Header(default=None)) -> None:
    """Dependency that validates the internal service auth header string securely."""
    if not INTERNAL_SERVICE_SECRET:
        return
    
    if not x_service_auth or not hmac.compare_digest(x_service_auth, INTERNAL_SERVICE_SECRET):
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized: invalid service auth"
        )

# FIX ISSUE 4 ONLY: Declare response_model contract on the route decorator
@router.post("/join-request", response_model=NotificationResponse)
async def handle_join_request_notification(
# FIX ISSUE 2 ONLY: Dropped 'async' so blocking I/O offloads to worker threads safely
@router.post("/join-request")
def handle_join_request_notification(
    payload: JoinRequestPayload,
    _: None = Depends(_verify_service_auth),
):
    """
    Webhook endpoint called by the Java backend when a new join request is created.
    """
    # FIX ISSUE 4 ONLY: Try-Except Block to manage response delivery variations safely
    try:
        notify_team_leader(
            team_id=payload.teamId,
            pitch=payload.pitch,
            skills=payload.skills,
            github=payload.github
        )
        return NotificationResponse(status="success", detail="Notification sent successfully")
        
    except Exception as e:
        logger.error(f"Failed to deliver join notification for team {payload.teamId}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to dispatch notification to team leader"
        )
