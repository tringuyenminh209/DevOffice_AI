"""DevOffice AI — Worker stub (Phase B).

POST /process が Go API から enqueue される。
本番は SQS poller。デモ・dev では HTTP 直接受信で代替。"""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field

from .settings import settings
from .simulator import simulate_task

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("worker")


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("worker stub starting (port=%d, go_api=%s)", settings.port, settings.go_api_url)
    yield
    # 進行中の background task が完了するまで猶予を与える
    await asyncio.sleep(0.1)


app = FastAPI(title="DevOffice AI Worker", lifespan=lifespan)


def require_internal_key(x_internal_key: str | None = Header(default=None)) -> None:
    if not x_internal_key or x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="invalid internal key")


class ProcessRequest(BaseModel):
    taskId: str = Field(..., min_length=1)
    userId: str
    companyId: str
    workflowType: str
    brief: str


@app.get("/health")
async def health():
    return {"success": True, "data": {"status": "ok", "service": "worker"}}


@app.post("/process", status_code=status.HTTP_202_ACCEPTED)
async def process(req: ProcessRequest, bg: BackgroundTasks,
                  x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)
    log.info("enqueue task=%s workflow=%s", req.taskId, req.workflowType)
    bg.add_task(simulate_task, req.taskId, req.workflowType, req.brief)
    return {"success": True, "data": {"accepted": True, "taskId": req.taskId}}
