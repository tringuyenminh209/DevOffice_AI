# Worker — DevOffice AI (Phase B stub)

Python FastAPI stub. Receives HTTP enqueue from Go API, simulates a fake CrewAI run, calls back via `/internal/*`.

Phase C で SQS poller + 本物の CrewAI 実行に置換。

## Layout

```
worker/
├── app/
│   ├── main.py        # FastAPI app + /process /health
│   ├── simulator.py   # 5社別 fake agent run
│   ├── go_client.py   # httpx client → Go /internal/*
│   └── settings.py
├── requirements.txt
├── Dockerfile.dev
└── .env.example
```

## Run native

```bash
cd Backend/worker
python -m venv .venv
. .venv/Scripts/activate     # Windows: source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8081
```

## Endpoints

- `GET /health`
- `POST /process` (X-Internal-Key) — Go API が呼出。202 即時返却 + asyncio で simulator 実行

## Simulation flow per task

1. POST `/internal/tasks/:id/event` `task.started` → Go API marks task running
2. Loop từng agent:
   - `agent.state {state: thinking}`
   - sleep
   - `agent.tool_call {tool, args}`
   - sleep
   - `agent.state {state: idle}`
3. (50% MK case) `POST /internal/approvals` — fire approval gate, wait 2s
4. `POST /internal/tasks/:id/complete` với `resultUrl`

Tổng thời gian: `SIMULATION_SECONDS` env (default 12s).

## Environment

| Var | Default | Note |
|---|---|---|
| `PORT` | 8081 | |
| `GO_API_URL` | http://localhost:8080 | |
| `INTERNAL_API_KEY` | dev-internal-key-change-me | phải khớp với Go API `.env` |
| `SIMULATION_SECONDS` | 12 | tổng thời gian simulate / task |
