-- DevOffice AI — Indexes

-- tasks: My Tasks listing (cursor pagination)
CREATE INDEX idx_tasks_user_created
  ON tasks (user_id, created_at DESC);

-- tasks: company aggregate（active_tasks recompute）
CREATE INDEX idx_tasks_company_status
  ON tasks (company_id, status)
  WHERE status IN ('queued','running','awaiting_approval');

-- task_events: Realtime tail + GET /tasks/:id/events
-- BRIN は append-only かつ created_at が単調増加する場合に有効
CREATE INDEX idx_task_events_task_created
  ON task_events USING BRIN (task_id, created_at);

-- approvals: 承認待ち検索
CREATE INDEX idx_approvals_task_status
  ON approvals (task_id, status);

-- credits_transactions: 履歴表示
CREATE INDEX idx_credits_tx_user_created
  ON credits_transactions (user_id, created_at DESC);
