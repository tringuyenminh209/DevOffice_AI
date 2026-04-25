# Backend — DevOffice AI

> Status: Phase A ✓, Phase B ✓, Phase C ✓, Phase D-dev ✓ (full self-contained dev env)
>
> **Dev: 1 binary đủ.** `go run ./cmd/server` → user signup → submit task → realtime events → result file trên Supabase Storage. Không cần Python, Docker, hay LLM API key.

## Layout

```
Backend/
├── api/                    # Go Echo v4 (services/api)
│   ├── cmd/server/         # Entry point
│   ├── internal/
│   │   ├── config/         # Env loading
│   │   ├── handler/        # HTTP handlers (echo) — public + internal
│   │   ├── middleware/     # Supabase JWT, X-Internal-Key, error envelope
│   │   ├── domain/         # Domain models + status transitions
│   │   ├── repository/     # pgx pool + queries (task, company, event, approval, credits)
│   │   ├── job/            # Background goroutines (approval-timeout)
│   │   ├── worker/         # HTTP client → Python worker (Phase B+ prod path)
│   │   ├── devworker/      # In-process Go simulator (Phase D-dev: replaces Python)
│   │   ├── storage/        # Supabase Storage REST client (replaces S3 in dev)
│   │   └── pkg/envelope/   # { success, data | error } response shape
│   └── go.mod
├── scripts/
│   └── e2e.sh              # End-to-end test (requires anon key + jq)
├── worker/                 # Python FastAPI stub (Phase B, optional in dev)
│   ├── app/
│   │   ├── main.py         # FastAPI app: POST /process, GET /health
│   │   ├── simulator.py    # 5-company fake crew (asyncio + per-agent events)
│   │   ├── go_client.py    # httpx client → Go /internal/*
│   │   └── settings.py
│   ├── requirements.txt
│   ├── Dockerfile.dev
│   └── .env.example
├── supabase/
│   ├── migrations/         # 3 SQL files: schema, indexes, RLS
│   └── seed.sql            # 5 companies + 5 workflow templates
├── docker-compose.yml      # Go API + Worker (hot-reload)
├── Makefile
└── CLAUDE.md
```

## Dev paths

### Default — single Go binary (Phase D-dev)

`api/.env` set `DEV_MODE=true` + `DEV_INPROCESS_WORKER=true` → simulator chạy trong process Go, upload result lên Supabase Storage. Không cần Python, Docker, LLM API key.

```bash
cd api && go run ./cmd/server
# API: http://localhost:8080
# Smoke test: curl http://localhost:8080/health/ready
```

### Production-like — Python worker (optional)

Khi cần test code path đi qua Python worker:

```bash
# api/.env: DEV_INPROCESS_WORKER=false, WORKER_URL=http://localhost:8081
# Terminal 1
make worker-install         # one-time
make worker-run             # uvicorn :8081
# Terminal 2
make api-run                # :8080
```

### Docker compose (cả hai)

```bash
make dev-up                 # api + python worker
make api-logs
make dev-down
```

Supabase Cloud (Tokyo, project ref `kvdopoljxiffptrvjgmx`) là DB + Auth + Storage mặc định.

## API endpoints

### Public (Supabase JWT — `Authorization: Bearer <jwt>`)

| Method | Path | Note |
|---|---|---|
| GET | /health | liveness |
| GET | /health/ready | DB ping |
| GET | /api/v1/companies | 5社一覧 |
| GET | /api/v1/companies/:id | 詳細 + agents |
| GET | /api/v1/world | 集計スナップショット |
| POST | /api/v1/tasks | brief → credits debit + insert + Worker enqueue |
| GET | /api/v1/tasks | 自分の最新20件 |
| GET | /api/v1/tasks/:id | 詳細 |
| GET | /api/v1/tasks/:id/events | Realtime reconnect バックフィル（owner only） |
| GET | /api/v1/tasks/:id/result | 成果物 URL（completed only。Phase D で S3 presigned）|
| GET | /api/v1/approvals | 自分の pending 一覧 |
| GET | /api/v1/approvals/:id | 承認詳細（owner only） |
| PATCH | /api/v1/approvals/:id | `{ decision: approved\|rejected, rejectionNote? }` |
| GET | /api/v1/credits/balance | `credits_balance` + 直近5件 |
| GET | /api/v1/credits/transactions | 履歴一覧 |
| POST | /api/v1/credits/dev-grant | `{ amount }` — `DEV_MODE=true` のみ。本番は 403 |

### Internal (X-Internal-Key — Worker → Go API only)

| Method | Path | Note |
|---|---|---|
| POST | /internal/tasks/:id/event | task_events INSERT (eventType=task.started auto sets running) |
| POST | /internal/tasks/:id/complete | mark completed + result_url |
| POST | /internal/tasks/:id/fail | mark failed + refund credits (atomic) |
| POST | /internal/approvals | INSERT approval + tasks.status='awaiting_approval' (atomic) |
| GET | /internal/approvals/:id | Worker poll for resolution |

## Realtime — postgres_changes (current Phase B)

Frontend dùng `supabase-js` subscribe trực tiếp vào table changes. Không cần Go API broadcast call.

```typescript
// world:global tương đương (companies aggregate)
supabase.channel('world')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, ...)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, ...)
  .subscribe();

// task:{taskId} tương đương (events filtered)
supabase.channel(`task:${taskId}`)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'task_events',
        filter: `task_id=eq.${taskId}` }, ...)
  .subscribe();
```

RLS đã enforce owner-only đọc nên frontend chỉ nhận events của tasks bản thân.

Phase C có thể chuyển sang explicit `Realtime Broadcast` API nếu cần channel-based latency tối ưu.

## Worker simulation (Phase B stub)

Flow khi `POST /api/v1/tasks` được gọi:

1. Go: credits debit + insert `tasks` (status=queued) — single TX
2. Go (goroutine async): HTTP POST `/process` tới Worker
3. Worker: 202 Accepted → BackgroundTask schedules `simulate_task`
4. Simulator (mỗi agent của workflow_type):
   - POST `/internal/tasks/:id/event` `task.started` → tasks.status='running'
   - per agent: thinking → tool_call → idle (event INSERT mỗi step)
   - 50% MK case: POST `/internal/approvals` → `awaiting_approval`
5. Final: POST `/internal/tasks/:id/complete` với mock `result_url`

Tổng thời gian: env `SIMULATION_SECONDS` (default 12s).

Worker offline → Go enqueue log warning, task vẫn ở `queued`. Có thể manual gọi `/internal/*` để test.

## Key facts

- **JWT**: Supabase HS256, `Authorization: Bearer`. Middleware extract `sub` → `c.Set("user_id", uuid)`.
- **Internal Key**: `X-Internal-Key`, constant-time compare, must match between `api/.env` và `worker/.env`.
- **DB**: pgx v5 pool. Connection string dùng pooler `default_query_exec_mode=exec` cho compat.
- **Response shape**: `{ success: true, data: ... }` / `{ success: false, error: { code, message } }`.
- **RLS**: enabled trên user-data tables. Go API connect bằng postgres role → bypass RLS, app-layer enforce `user_id = auth.uid()` trong queries.
- **Currency**: credits = INT. Refund = INSERT mới vào `credits_transactions` (append-only).

## What NOT to do

- Đừng đụng `auth.users` — chỉ reference. Supabase tự quản.
- Đừng UPDATE/DELETE `credits_transactions` — trigger sẽ raise.
- Đừng hardcode `INTERNAL_API_KEY` — luôn qua env.
- Đừng add axios kiểu lib (Frontend rule, kept consistent).
- Đừng commit `.env`. Chỉ `.env.example`.

## Background jobs (in-process)

- **approval-timeout**: scan mỗi 30s, pending approvals > 15 phút → `timeout` + tasks.failed + refund credits + `task.failed` event. Code: `internal/job/approval_timeout.go`.

## Storage (Supabase, dev path)

- Bucket `task-results` (private, 5MiB limit, RLS: `(name).foldername[0] = auth.uid()`)
- Path convention: `{user_id}/{task_id}.html`
- Devworker generates placeholder HTML, uploads via `internal/storage/supabase.go`
- `GET /tasks/:id/result` converts stored path → Supabase signed URL (15 phút TTL)
- Phase E: swap `internal/storage/` package implementation cho AWS S3 SDK (cùng interface)

## Dev-only flags (api/.env)

| Flag | Default | What it does |
|---|---|---|
| `DEV_MODE` | false | Cho phép `POST /credits/dev-grant` (top-up không qua Stripe) |
| `DEV_INPROCESS_WORKER` | false | `task.Create` enqueue vào Go simulator thay vì HTTP→Python |
| `SIMULATION_SECONDS` | 12 | Thời gian fake CrewAI run |
| `STORAGE_BUCKET_TASK_RESULTS` | task-results | Bucket Supabase Storage |

**Production**: cả 2 dev flag phải `false`. Worker = Python+CrewAI thật (qua SQS).

## Phase E (production migration, sau khi MVP)

- AWS SQS sender thật (replace `internal/worker/client.go` → SQS SendMessage)
- LocalStack hoặc ElasticMQ cho dev SQS testing
- CrewAI thật trong Python worker (replace `simulator.py`)
- AWS S3 SDK cho `internal/storage/` (giữ nguyên interface)
- Stripe Checkout + Webhook (`POST /api/v1/credits/checkout`, `POST /api/v1/credits/webhook`)
- ECS Fargate deploy + Terraform infra
- Realtime Broadcast API explicit (nếu postgres_changes không đủ latency)
