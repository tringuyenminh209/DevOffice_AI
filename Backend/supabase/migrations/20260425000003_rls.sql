-- DevOffice AI — Row Level Security policies
--
-- 設計原則:
--  * companies / workflow_templates: 全ユーザー read 可（書込はマイグレーション/seed のみ）
--  * tasks / task_events / approvals / credits_transactions: 本人のみ
--  * /internal/* で service_role を使う場合は RLS bypass される（Postgres の挙動）

ALTER TABLE workflow_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_transactions  ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- public read (companies / workflow_templates)
-- ---------------------------------------------------------------
CREATE POLICY workflow_templates_read_all
  ON workflow_templates FOR SELECT
  USING (true);

CREATE POLICY companies_read_all
  ON companies FOR SELECT
  USING (true);

-- ---------------------------------------------------------------
-- user_profiles: self-only
-- ---------------------------------------------------------------
CREATE POLICY user_profiles_self_select
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY user_profiles_self_update
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------
-- tasks: owner-only
-- INSERT は Go API service_role 経由（credits debit + 同一 TX）。
-- ユーザートークン直接 INSERT は禁止。
-- ---------------------------------------------------------------
CREATE POLICY tasks_self_select
  ON tasks FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------
-- task_events: owner-only via tasks join
-- ---------------------------------------------------------------
CREATE POLICY task_events_owner_select
  ON task_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
       WHERE tasks.id = task_events.task_id
         AND tasks.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- approvals: owner-only via tasks join
-- ---------------------------------------------------------------
CREATE POLICY approvals_owner_select
  ON approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
       WHERE tasks.id = approvals.task_id
         AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY approvals_owner_update
  ON approvals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
       WHERE tasks.id = approvals.task_id
         AND tasks.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- credits_transactions: owner-only read
-- ---------------------------------------------------------------
CREATE POLICY credits_tx_self_select
  ON credits_transactions FOR SELECT
  USING (user_id = auth.uid());
