"""HTTP client for Go API /internal/* endpoints."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from .settings import settings

log = logging.getLogger(__name__)


class GoAPIClient:
    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = (base_url or settings.go_api_url).rstrip("/")
        self.api_key = api_key or settings.internal_api_key
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(8.0, connect=3.0),
            headers={
                "X-Internal-Key": self.api_key,
                "Content-Type": "application/json",
            },
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            resp = await self._client.post(url, json=body)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as exc:
            log.warning("go-api %s failed: %s", path, exc)
            raise

    async def post_event(
        self,
        task_id: str,
        event_type: str,
        agent_id: str | None = None,
        payload: dict[str, Any] | None = None,
    ) -> None:
        await self._post(
            f"/internal/tasks/{task_id}/event",
            {
                "agentId": agent_id,
                "eventType": event_type,
                "payload": payload or {},
            },
        )

    async def post_complete(
        self,
        task_id: str,
        result_url: str | None = None,
        result_type: str | None = None,
    ) -> None:
        await self._post(
            f"/internal/tasks/{task_id}/complete",
            {"resultUrl": result_url, "resultType": result_type},
        )

    async def post_fail(self, task_id: str, error_message: str) -> None:
        await self._post(
            f"/internal/tasks/{task_id}/fail",
            {"errorMessage": error_message},
        )

    async def post_approval(
        self,
        task_id: str,
        action_name: str,
        action_payload: dict[str, Any],
        risk_level: str,
    ) -> dict[str, Any]:
        return await self._post(
            "/internal/approvals",
            {
                "taskId": task_id,
                "actionName": action_name,
                "actionPayload": action_payload,
                "riskLevel": risk_level,
            },
        )

    async def get_approval(self, approval_id: str) -> dict[str, Any]:
        url = f"{self.base_url}/internal/approvals/{approval_id}"
        resp = await self._client.get(url)
        resp.raise_for_status()
        return resp.json()
