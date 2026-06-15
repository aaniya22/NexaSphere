import logging

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks

from models.forms import FormSubmission
from services.supabase import supabase_service
from services.sync_worker import process_sync_queue
from utils.security import limiter

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/api/forms/membership")
@limiter.limit("5/hour")
async def submit_membership(request: Request, form: FormSubmission, background_tasks: BackgroundTasks):
    try:
        form_dict = form.model_dump()

        # Synchronously write to Supabase (our source of truth)
        await supabase_service.insert_membership(form_dict)

        # Enqueue the sheets sync task
        await supabase_service.enqueue_sheets_sync("Membership", form_dict)

        # Trigger background processing of the sync queue
        background_tasks.add_task(process_sync_queue)

        return {
            "ok": True,
            "message": "Membership form submitted successfully",
        }
    except Exception as e:
        logger.exception("Membership form error")
        raise HTTPException(status_code=500, detail="Failed to submit form") from e


@router.post("/api/forms/recruitment")
@limiter.limit("5/hour")
async def submit_recruitment(request: Request, form: FormSubmission, background_tasks: BackgroundTasks):
    try:
        form_dict = form.model_dump()

        # Synchronously write to Supabase
        await supabase_service.insert_recruitment(form_dict)

        # Enqueue the sheets sync task
        await supabase_service.enqueue_sheets_sync("Recruitment", form_dict)

        # Trigger background processing of the sync queue
        background_tasks.add_task(process_sync_queue)

        return {
            "ok": True,
            "message": "Recruitment form submitted successfully",
        }
    except Exception as e:
        logger.exception("Recruitment form error")
        raise HTTPException(status_code=500, detail="Failed to submit form") from e


@router.post("/api/core-team/apply")
@limiter.limit("5/hour")
async def submit_core_team_application(request: Request, form: FormSubmission, background_tasks: BackgroundTasks):
    try:
        form_dict = form.model_dump()

        # Synchronously write to Supabase
        await supabase_service.insert_core_team_application(form_dict)

        # Enqueue the sheets sync task
        await supabase_service.enqueue_sheets_sync("CoreTeam", form_dict)

        # Trigger background processing of the sync queue
        background_tasks.add_task(process_sync_queue)

        return {
            "ok": True,
            "message": "Application submitted successfully",
        }
    except Exception as e:
        logger.exception("Core team application error")
        raise HTTPException(status_code=500, detail="Failed to submit application") from e


