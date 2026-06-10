import asyncio
import os
from datetime import datetime
from typing import Any, Dict
import gspread
from google.oauth2.service_account import Credentials

class SheetsService:
    def __init__(self) -> None:
        private_key = os.getenv("GOOGLE_PRIVATE_KEY")
        sheet_id = os.getenv("GOOGLE_SHEET_ID")

        # Dev mode: skip Google connection if credentials are dummy/missing
        if not private_key or "dummy" in private_key:
            self.client = None
            self.sheet_id = None
            return

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        creds_dict = {
            "type": "service_account",
            "project_id": os.getenv("GOOGLE_PROJECT_ID"),
            "private_key": private_key.replace("\\n", "\n"),
            "client_email": os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        self.client = gspread.authorize(creds)
        self.sheet_id = sheet_id

    def _append_to_worksheet(self, worksheet_name: str, form_data: Dict[str, Any]) -> None:
        if self.client is None:
            print(f"[DEV MODE] Skipping Google Sheets write to '{worksheet_name}': {form_data}")
            return
        sheet = self.client.open_by_key(self.sheet_id).worksheet(worksheet_name)
        row = [
            datetime.now().isoformat(),
            form_data["name"],
            form_data["email"],
            form_data["whatsapp"],
            form_data["year"],
            form_data["branch"],
            form_data["section"],
            form_data.get("reason") or "",
        ]
        sheet.append_row(row)

    async def append_membership(self, form_data: Dict[str, Any]) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._append_to_worksheet, "Membership", form_data)

    async def append_recruitment(self, form_data: Dict[str, Any]) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._append_to_worksheet, "Recruitment", form_data)

    async def append_core_team_application(self, form_data: Dict[str, Any]) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._append_to_worksheet, "CoreTeamApplications", form_data)

sheets_service = SheetsService()