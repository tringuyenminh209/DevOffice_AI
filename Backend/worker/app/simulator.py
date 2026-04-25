"""Stub crew simulator: emit fake agent events over time. Phase B のデモ用。
Phase C で CrewAI 実行に差し替え。"""
from __future__ import annotations

import asyncio
import logging
import random
from dataclasses import dataclass

from .go_client import GoAPIClient
from .settings import settings

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class WorkflowAgent:
    id: str
    role: str


# Frontend / Supabase seed と一致させる（CLAUDE.md 参照）
WORKFLOW_AGENTS: dict[str, list[WorkflowAgent]] = {
    "MK": [
        WorkflowAgent("researcher", "Researcher"),
        WorkflowAgent("copywriter", "Copywriter"),
        WorkflowAgent("designer", "Designer"),
        WorkflowAgent("approver", "Approver"),
    ],
    "DV": [
        WorkflowAgent("planner", "Planner"),
        WorkflowAgent("coder", "Coder"),
        WorkflowAgent("reviewer", "Reviewer"),
        WorkflowAgent("qa", "QA"),
    ],
    "LG": [
        WorkflowAgent("analyst", "Analyst"),
        WorkflowAgent("researcher", "Researcher"),
        WorkflowAgent("reviewer", "Reviewer"),
    ],
    "RS": [
        WorkflowAgent("researcher_1", "Researcher"),
        WorkflowAgent("researcher_2", "Researcher"),
        WorkflowAgent("writer", "Writer"),
        WorkflowAgent("reviewer", "Reviewer"),
    ],
    "AN": [
        WorkflowAgent("analyst", "Analyst"),
        WorkflowAgent("visualizer", "Visualizer"),
        WorkflowAgent("reporter", "Reporter"),
    ],
}


async def simulate_task(task_id: str, workflow_type: str, brief: str) -> None:
    """Run a fake crew. Emits events to Go API, then completes.
    エラーは log のみ — `task` 自体は best-effort 実行。"""
    client = GoAPIClient()
    try:
        await _run(client, task_id, workflow_type, brief)
    except Exception as exc:
        log.exception("simulation crashed: %s", exc)
        try:
            await client.post_fail(task_id, f"worker crashed: {exc}")
        except Exception:
            pass
    finally:
        await client.aclose()


async def _run(client: GoAPIClient, task_id: str, workflow_type: str, brief: str) -> None:
    agents = WORKFLOW_AGENTS.get(workflow_type, WORKFLOW_AGENTS["MK"])
    total = max(settings.simulation_seconds, len(agents) * 2)
    per_agent = total / len(agents)

    log.info("[%s] starting %s (%ds, %d agents)", task_id, workflow_type, total, len(agents))

    await client.post_event(task_id, "task.started", payload={"workflowType": workflow_type})

    for idx, agent in enumerate(agents):
        await client.post_event(task_id, "agent.state",
                                agent_id=agent.id, payload={"state": "thinking"})
        await asyncio.sleep(per_agent * 0.4)

        tool = random.choice(["search", "read_file", "write_draft", "review"])
        await client.post_event(task_id, "agent.tool_call",
                                agent_id=agent.id,
                                payload={"tool": tool, "args": {"hint": brief[:60]}})
        await asyncio.sleep(per_agent * 0.5)

        await client.post_event(task_id, "agent.state",
                                agent_id=agent.id, payload={"state": "idle"})
        await asyncio.sleep(per_agent * 0.1)

        # Demo: 中間で 1 回だけ承認ゲートを発動（MK の Approver / 50% 確率）
        if agent.id == "approver" and random.random() < 0.5:
            log.info("[%s] firing approval gate", task_id)
            try:
                await client.post_approval(
                    task_id=task_id,
                    action_name="publish_landing_page",
                    action_payload={"target": "production"},
                    risk_level="MEDIUM",
                )
                # demo では承認結果を待たずに進む（resolve は frontend から PATCH）
                await asyncio.sleep(2)
            except Exception:
                log.warning("approval post failed", exc_info=True)

    # resultUrl 渡さず → Go API が Supabase Storage に placeholder upload + sign on read
    await client.post_complete(task_id)
    log.info("[%s] completed", task_id)
