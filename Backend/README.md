# DevOffice AI — Backend

Go Echo v4 API + Supabase. Phase A → D-dev complete (full self-contained dev env).

## Quickstart (1 command)

```bash
cd api && go run ./cmd/server
```

Mặc định:
- `DEV_INPROCESS_WORKER=true` → Go simulator chạy thay Python worker
- `DEV_MODE=true` → `POST /credits/dev-grant` enabled
- DB + Auth + Storage = Supabase Cloud Tokyo (đã setup trong `api/.env`)
- Approval timeout job mỗi 30s

Không cần Python, Docker, LLM API key.

## Verified E2E (Phase D-dev)

| Step | Latency | Note |
|---|---|---|
| signup user (admin API) | ~150ms | Supabase Auth |
| `POST /credits/dev-grant {amount:100}` | ~130ms | balance: 50→150 |
| `POST /tasks` (MK, brief) | ~125ms | credits debit + queued + enqueue devworker |
| poll task status | every 2s | `queued → running → awaiting_approval → completed` (~15s) |
| `GET /tasks/:id/result` | ~90ms | Supabase Storage signed URL (15 phút) |
| `GET /tasks/:id/events` | ~35ms | 15 events: started + 4×3 agent + approval + completed |

---

## Quickstart — Supabase Cloud

Project ref đã set: `kvdopoljxiffptrvjgmx` (region: `ap-northeast-1`).

### 1. Lấy JWT secret

Dashboard → Settings → API → **JWT Secret** → copy giá trị → paste vào `api/.env` ở dòng `SUPABASE_JWT_SECRET=`.

### 2. Migrations đã applied

7 bảng + seed (5 companies, 5 workflow templates) đã chạy lên cloud. Verify trên Studio:
https://kvdopoljxiffptrvjgmx.supabase.co (Table Editor)

Để re-apply (sau khi thêm migration mới):

```bash
make db-push-cloud
```

### 3. Run Go API

```bash
make api-up               # Docker hot-reload (port 8080)
make api-logs
curl http://localhost:8080/health
curl http://localhost:8080/health/ready    # ping cloud DB
```

Hoặc chạy native (Go 1.22):

```bash
cd api && go run ./cmd/server
```

### 4. Tạo user test + lấy access token

Cách nhanh: Dashboard → Authentication → Users → **Add user** → email + password.

Lấy token qua REST:

```bash
curl -X POST 'https://kvdopoljxiffptrvjgmx.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpass"}'
```

Anon key: Dashboard → Settings → API → `anon` `public`.

### 5. Smoke test API

```bash
TOKEN="<access_token>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/companies
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/world

# Get a company UUID first, then create task:
COMPANY_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/companies | jq -r '.data.companies[0].id')

curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"companyId\":\"$COMPANY_ID\",\"brief\":\"Make me a landing page copy\"}" \
  http://localhost:8080/api/v1/tasks
```

---

## Endpoints (Phase A)

| Method | Path | Note |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/health/ready` | DB ping |
| GET | `/api/v1/companies` | 5社一覧 |
| GET | `/api/v1/companies/:id` | 詳細 + agents |
| GET | `/api/v1/world` | 集計スナップショット |
| POST | `/api/v1/tasks` | `{ companyId, brief }` → credits debit + insert |
| GET | `/api/v1/tasks` | 自分のタスク（最新20） |
| GET | `/api/v1/tasks/:id` | 詳細 |

Auth: `Authorization: Bearer <Supabase JWT>`. Response envelope: `{ success, data | error }`.

---

## Local dev (offline option)

```bash
make supabase-up         # Studio:54323 / DB:54322 / API:54321
make db-reset            # apply migrations + seed
make supabase-status     # copy JWT secret
# update api/.env: DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres?sslmode=disable
make api-up
```

---

## Database schema

7 tables (xem `supabase/migrations/`):

- `workflow_templates` — 5社マスタ（seed）
- `companies` — 5社固定 + grid 配置
- `user_profiles` — auth.users 拡張、`credits_balance` 含む（trigger 自動作成、初期 50 credits）
- `tasks` — コアエンティティ
- `task_events` — agent activity log
- `approvals` — 承認ゲート（Phase B で active）
- `credits_transactions` — append-only audit (UPDATE/DELETE 禁止 trigger)

RLS enabled. Frontend (anon JWT) → `auth.uid() = user_id` enforced. Go API → service-side connection (postgres role) → bypass RLS, app-layer enforcement.

---

## Phase B (next)

- `/internal/*` endpoints (Worker → Go API, X-Internal-Key auth)
- Supabase Realtime broadcast (`world:global`, `task:{id}`)
- Python AI Worker stub (FastAPI + SQS poller)
- LocalStack / ElasticMQ cho SQS local

Xem `CLAUDE.md`.
