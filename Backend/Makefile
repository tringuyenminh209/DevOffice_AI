.PHONY: help supabase-up supabase-down supabase-status db-reset db-push db-push-cloud api-run api-up api-down api-logs api-build api-shell worker-run worker-install dev-up dev-down tidy

help:
	@echo "Targets:"
	@echo "  supabase-up      - supabase start (Studio:54323, DB:54322, API:54321)"
	@echo "  supabase-down    - supabase stop"
	@echo "  supabase-status  - show URLs + JWT secret"
	@echo "  db-reset         - drop + apply migrations + seed (DESTRUCTIVE)"
	@echo "  db-push          - apply pending migrations only"
	@echo "  api-run          - go run native (no Docker needed)"
	@echo "  api-up           - docker compose up (Go API hot-reload, requires Docker Desktop)"
	@echo "  worker-install   - pip install worker requirements (run once, native)"
	@echo "  worker-run       - uvicorn native (port 8081, requires venv)"
	@echo "  dev-up           - api + worker in docker compose"
	@echo "  dev-down         - stop all"
	@echo "  api-down         - stop Go API"
	@echo "  api-logs         - tail API logs"
	@echo "  api-shell        - exec into API container"
	@echo "  tidy             - go mod tidy inside container"

supabase-up:
	cd supabase && supabase start

supabase-down:
	cd supabase && supabase stop

supabase-status:
	cd supabase && supabase status

db-reset:
	cd supabase && supabase db reset

db-push:
	cd supabase && supabase db push

# Cloud: re-apply migrations + seed to Supabase Cloud (uses DATABASE_URL from api/.env)
db-push-cloud:
	@set -a; . ./api/.env; set +a; \
	for f in supabase/migrations/*.sql supabase/seed.sql; do \
	  echo ">> $$f"; \
	  PGPASSWORD=$$(echo "$$DATABASE_URL" | sed -E 's|.+://[^:]+:([^@]+)@.+|\1|') \
	    psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$$f" || exit 1; \
	done

api-run:
	cd api && go run ./cmd/server

worker-install:
	cd worker && python -m pip install -r requirements.txt

worker-run:
	cd worker && python -m uvicorn app.main:app --reload --port 8081

dev-up:
	docker compose up -d --build
	@echo "API:    http://localhost:8080/health"
	@echo "Worker: http://localhost:8081/health"

dev-down:
	docker compose down

api-up:
	docker compose up -d --build api
	@echo "API: http://localhost:8080/health"

api-down:
	docker compose down

api-logs:
	docker compose logs -f api

api-build:
	docker compose build api

api-shell:
	docker compose exec api sh

tidy:
	docker compose exec api go mod tidy
