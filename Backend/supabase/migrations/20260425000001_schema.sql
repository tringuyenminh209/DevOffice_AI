-- DevOffice AI — Core schema (Phase A)
-- Tables: workflow_templates, companies, user_profiles, tasks, task_events, approvals, credits_transactions

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- workflow_templates: 5社のマスタ定義（seed-only, app側で更新しない）
-- =========================================================================
CREATE TABLE workflow_templates (
  workflow_type    TEXT PRIMARY KEY CHECK (workflow_type IN ('MK','DV','LG','RS','AN')),
  display_name     TEXT NOT NULL,
  building_color   TEXT NOT NULL,
  credits_per_task INT  NOT NULL DEFAULT 10 CHECK (credits_per_task > 0),
  avg_minutes      INT  NOT NULL CHECK (avg_minutes > 0),
  default_agents   JSONB NOT NULL,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- companies: 5社固定（grid 配置 + 集計ステータス）
-- =========================================================================
CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL UNIQUE REFERENCES workflow_templates(workflow_type),
  name          TEXT NOT NULL,
  grid_x        SMALLINT NOT NULL CHECK (grid_x BETWEEN 0 AND 2),
  grid_y        SMALLINT NOT NULL CHECK (grid_y BETWEEN 0 AND 1),
  active_tasks  INT NOT NULL DEFAULT 0 CHECK (active_tasks >= 0),
  status        TEXT NOT NULL DEFAULT 'idle'
                  CHECK (status IN ('idle','running','awaiting_approval')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grid_x, grid_y)
);

-- =========================================================================
-- user_profiles: auth.users 拡張（credits 残高 + プロフィール）
-- Trigger で auth.users INSERT 時に自動作成
-- =========================================================================
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_balance INT NOT NULL DEFAULT 50 CHECK (credits_balance >= 0),
  display_name    TEXT,
  avatar_url      TEXT,
  language        VARCHAR(5) NOT NULL DEFAULT 'ja',
  timezone        VARCHAR(40) NOT NULL DEFAULT 'Asia/Tokyo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, credits_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    50
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =========================================================================
-- tasks: コアテーブル
-- status: queued → running → (awaiting_approval) → completed | failed
-- =========================================================================
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id),
  brief           TEXT NOT NULL CHECK (length(brief) BETWEEN 1 AND 4000),
  status          VARCHAR(30) NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','running','awaiting_approval','completed','failed')),
  credits_charged INT NOT NULL CHECK (credits_charged > 0),
  result_url      TEXT,
  result_type     TEXT,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- =========================================================================
-- task_events: agent activity log（Realtime broadcast の source）
-- =========================================================================
CREATE TABLE task_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id    TEXT,
  event_type  TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- approvals: 承認ゲート
-- =========================================================================
CREATE TABLE approvals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action_name    TEXT NOT NULL,
  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_level     TEXT NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','timeout')),
  rejection_note TEXT,
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

-- =========================================================================
-- credits_transactions: append-only audit log
-- DELETE / UPDATE はトリガーで禁止
-- =========================================================================
CREATE TABLE credits_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  task_id            UUID REFERENCES tasks(id) ON DELETE SET NULL,
  amount             INT NOT NULL,
  tx_type            TEXT NOT NULL CHECK (tx_type IN ('purchase','debit','refund')),
  stripe_session_id  TEXT UNIQUE,
  description        TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.deny_credits_tx_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'credits_transactions is append-only';
END;
$$;

CREATE TRIGGER credits_tx_no_update
  BEFORE UPDATE ON credits_transactions
  FOR EACH ROW EXECUTE FUNCTION public.deny_credits_tx_mutation();

CREATE TRIGGER credits_tx_no_delete
  BEFORE DELETE ON credits_transactions
  FOR EACH ROW EXECUTE FUNCTION public.deny_credits_tx_mutation();

-- =========================================================================
-- updated_at 自動更新 trigger
-- =========================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_touch        BEFORE UPDATE ON companies        FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER user_profiles_touch    BEFORE UPDATE ON user_profiles    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tasks_touch            BEFORE UPDATE ON tasks            FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
