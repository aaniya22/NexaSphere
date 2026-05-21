import logging

logger = logging.getLogger(__name__)

def notify_team_leader(team_id: int, pitch: str, skills: str, github: str):
    """
    Placeholder logic to notify the team leader about a join request.
    This could be expanded to send an email or an in-app push notification.
    """
    logger.info(f"Notification triggered for Team ID {team_id}")
    logger.info(f"New Applicant Pitch: {pitch}")
    logger.info(f"Applicant Skills: {skills}")
    logger.info(f"Applicant GitHub: {github}")
    
    # Returning a success status
    return {"status": "success", "message": f"Team {team_id} leader notified."}

def notify_developer(status: str):
    """
    Placeholder logic to notify the developer about request approval/rejection.
    """
    logger.info(f"Notifying developer that their request was {status}")
    return {"status": "success", "message": f"Developer notified of {status}."}
