import os
from typing import Any, Dict

import httpx


class SupabaseService:
    def __init__(self) -> None:
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.url:
            raise RuntimeError("Missing SUPABASE_URL")
        if not self.key:
            raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY")

        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    async def _insert(self, table: str, form_data: Dict[str, Any]) -> None:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/rest/v1/{table}",
                headers=self.headers,
                json=form_data,
            )
            response.raise_for_status()

    async def insert_membership(self, form_data: Dict[str, Any]) -> None:
        """Insert into membership_forms table"""
        await self._insert("membership_forms", form_data)

    async def insert_recruitment(self, form_data: Dict[str, Any]) -> None:
        """Insert into recruitment_forms table"""
        await self._insert("recruitment_forms", form_data)

    async def insert_core_team_application(self, form_data: Dict[str, Any]) -> None:
        """Insert into core_team_applications table"""
        await self._insert("core_team_applications", form_data)

    async def enqueue_sheets_sync(self, form_type: str, payload: Dict[str, Any], last_error: str = None) -> None:
        """Enqueue a failed sheets sync to the queue"""
        data = {
            "form_type": form_type,
            "payload": payload,
            "retry_count": 0,
            "last_error": last_error,
            "status": "pending",
        }
        await self._insert("google_sheets_sync_queue", data)

    async def fetch_pending_syncs(self) -> list:
        """Fetch pending items from the google_sheets_sync_queue table"""
        headers = {k: v for k, v in self.headers.items() if k != "Prefer"}
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/rest/v1/google_sheets_sync_queue?status=eq.pending&retry_count=lt.5&select=*&order=id.asc&limit=10",
                headers=headers,
            )
            response.raise_for_status()
            return response.json()

    async def delete_sync_task(self, task_id: int) -> None:
        """Delete a completed task from the queue"""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.url}/rest/v1/google_sheets_sync_queue?id=eq.{task_id}",
                headers=self.headers,
            )
            response.raise_for_status()

    async def claim_sync_task(self, task_id: int, worker_id: str) -> bool:
        """Atomically claim a pending task by setting its status to 'processing'"""
        from datetime import datetime, timezone
        headers = {**self.headers, "Prefer": "return=representation"}
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.url}/rest/v1/google_sheets_sync_queue?id=eq.{task_id}&status=eq.pending",
                headers=headers,
                json={
                    "status": "processing",
                    "locked_by": worker_id,
                    "locked_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
            )
            response.raise_for_status()
            return len(response.json()) > 0

    async def release_failed_sync_task(self, task_id: int, retry_count: int, last_error: str) -> None:
        """Release a failed task back to 'pending' state or mark it as 'failed' if retries exceeded"""
        from datetime import datetime, timezone
        status = "failed" if retry_count >= 5 else "pending"
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.url}/rest/v1/google_sheets_sync_queue?id=eq.{task_id}",
                headers=self.headers,
                json={
                    "status": status,
                    "retry_count": retry_count,
                    "last_error": last_error,
                    "locked_by": None,
                    "locked_at": None,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
            )
            response.raise_for_status()

    async def release_stale_locks(self) -> None:
        """Release any tasks that have been locked/processing for more than 10 minutes"""
        from datetime import datetime, timezone, timedelta
        headers = self.headers
        stale_time = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.url}/rest/v1/google_sheets_sync_queue?status=eq.processing&locked_at=lt.{stale_time}",
                headers=headers,
                json={
                    "status": "pending",
                    "locked_by": None,
                    "locked_at": None,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
            )
            response.raise_for_status()


supabase_service = SupabaseService()


