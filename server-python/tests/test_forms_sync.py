import pytest
from unittest.mock import AsyncMock, patch, ANY
from fastapi.testclient import TestClient
from main import app
from services.sync_worker import process_sync_queue, sync_single_item

client = TestClient(app)


@pytest.fixture(autouse=True)
def disable_limiter():
    original_enabled = getattr(app.state.limiter, "enabled", True)
    app.state.limiter.enabled = False
    yield
    app.state.limiter.enabled = original_enabled


@pytest.mark.anyio
@patch("routers.forms.process_sync_queue")
@patch("routers.forms.supabase_service")
async def test_form_submission_enqueues(mock_supabase, mock_process_sync):
    # Setup mocks
    mock_supabase.insert_membership = AsyncMock()
    mock_supabase.enqueue_sheets_sync = AsyncMock()

    payload = {
        "name": "Priya Verma",
        "email": "priya.verma@example.com",
        "whatsapp": "9876543210",
        "year": "1st Year",
        "branch": "CSE",
        "section": "B",
        "reason": "To join the community"
    }

    response = client.post("/api/forms/membership", json=payload)
    assert response.status_code == 200
    assert response.json()["ok"] is True

    # Supabase insert should have been called synchronously
    mock_supabase.insert_membership.assert_called_once_with(payload)
    # Task enqueue should have been called synchronously
    mock_supabase.enqueue_sheets_sync.assert_called_once_with("Membership", payload)


@pytest.mark.anyio
@patch("services.sync_worker.sheets_service")
@patch("services.sync_worker.supabase_service")
async def test_sync_single_item_success(mock_supabase, mock_sheets):
    mock_sheets.append_membership = AsyncMock()
    mock_supabase.delete_sync_task = AsyncMock()

    payload = {"name": "Test User"}
    success = await sync_single_item(1, "Membership", payload, 0)

    assert success is True
    mock_sheets.append_membership.assert_called_once_with(payload)
    mock_supabase.delete_sync_task.assert_called_once_with(1)


@pytest.mark.anyio
@patch("services.sync_worker.sheets_service")
@patch("services.sync_worker.supabase_service")
async def test_sync_single_item_failure_updates(mock_supabase, mock_sheets):
    mock_sheets.append_membership = AsyncMock(side_effect=Exception("Auth error"))
    mock_supabase.release_failed_sync_task = AsyncMock()

    payload = {"name": "Test User"}
    success = await sync_single_item(1, "Membership", payload, 1)

    assert success is False
    mock_sheets.append_membership.assert_called_once_with(payload)
    mock_supabase.release_failed_sync_task.assert_called_once_with(1, 2, "Auth error")


@pytest.mark.anyio
@patch("services.sync_worker.sync_single_item")
@patch("services.sync_worker.supabase_service")
async def test_process_sync_queue(mock_supabase, mock_sync_item):
    mock_supabase.release_stale_locks = AsyncMock()
    mock_supabase.fetch_pending_syncs = AsyncMock(return_value=[
        {"id": 1, "form_type": "Membership", "payload": {"name": "A"}, "retry_count": 0},
        {"id": 2, "form_type": "Recruitment", "payload": {"name": "B"}, "retry_count": 5},
        {"id": 3, "form_type": "CoreTeam", "payload": {"name": "C"}, "retry_count": 1}
    ])
    mock_supabase.claim_sync_task = AsyncMock(side_effect=lambda task_id, worker_id: task_id != 2)
    mock_sync_item.return_value = True

    await process_sync_queue()

    mock_supabase.release_stale_locks.assert_called_once()
    mock_supabase.fetch_pending_syncs.assert_called_once()
    
    mock_supabase.claim_sync_task.assert_any_call(1, ANY)
    mock_supabase.claim_sync_task.assert_any_call(3, ANY)
    
    assert mock_sync_item.call_count == 2
    mock_sync_item.assert_any_call(1, "Membership", {"name": "A"}, 0)
    mock_sync_item.assert_any_call(3, "CoreTeam", {"name": "C"}, 1)


@pytest.mark.anyio
@patch("services.sync_worker.sync_single_item")
@patch("services.sync_worker.supabase_service")
async def test_process_sync_queue_claim_concurrency(mock_supabase, mock_sync_item):
    mock_supabase.release_stale_locks = AsyncMock()
    mock_supabase.fetch_pending_syncs = AsyncMock(return_value=[
        {"id": 10, "form_type": "Membership", "payload": {"name": "A"}, "retry_count": 0}
    ])
    mock_supabase.claim_sync_task = AsyncMock(return_value=False)
    mock_sync_item.return_value = True

    await process_sync_queue()

    mock_supabase.release_stale_locks.assert_called_once()
    mock_supabase.claim_sync_task.assert_called_once_with(10, ANY)
    mock_sync_item.assert_not_called()
