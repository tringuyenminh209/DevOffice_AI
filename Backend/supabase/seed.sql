-- DevOffice AI — Seed (5 workflow templates + 5 companies)
-- Idempotent: ON CONFLICT DO NOTHING で複数回実行可

INSERT INTO workflow_templates
  (workflow_type, display_name, building_color, credits_per_task, avg_minutes, default_agents, description)
VALUES
  ('MK', 'Marketing Crew', '#DA3950', 10, 18,
   '[
      {"id":"researcher","role":"Researcher","color":"#DA3950"},
      {"id":"copywriter","role":"Copywriter","color":"#DA3950"},
      {"id":"designer","role":"Designer","color":"#DA3950"},
      {"id":"approver","role":"Approver","color":"#DA3950"}
    ]'::jsonb,
   'LP・SNS・広告コピー作成'),

  ('DV', 'Dev Team', '#5E55EA', 15, 25,
   '[
      {"id":"planner","role":"Planner","color":"#5E55EA"},
      {"id":"coder","role":"Coder","color":"#5E55EA"},
      {"id":"reviewer","role":"Reviewer","color":"#5E55EA"},
      {"id":"qa","role":"QA","color":"#5E55EA"}
    ]'::jsonb,
   'コード生成・レビュー・テスト'),

  ('LG', 'Legal Review', '#800080', 12, 20,
   '[
      {"id":"analyst","role":"Analyst","color":"#800080"},
      {"id":"researcher","role":"Researcher","color":"#800080"},
      {"id":"reviewer","role":"Reviewer","color":"#800080"}
    ]'::jsonb,
   '契約書・規約チェック'),

  ('RS', 'Research Lab', '#267ADE', 10, 30,
   '[
      {"id":"researcher_1","role":"Researcher","color":"#267ADE"},
      {"id":"researcher_2","role":"Researcher","color":"#267ADE"},
      {"id":"writer","role":"Writer","color":"#267ADE"},
      {"id":"reviewer","role":"Reviewer","color":"#267ADE"}
    ]'::jsonb,
   '市場調査・レポート作成'),

  ('AN', 'Analytics', '#10B06B', 8, 15,
   '[
      {"id":"analyst","role":"Analyst","color":"#10B06B"},
      {"id":"visualizer","role":"Visualizer","color":"#10B06B"},
      {"id":"reporter","role":"Reporter","color":"#10B06B"}
    ]'::jsonb,
   'データ分析・BI レポート')
ON CONFLICT (workflow_type) DO UPDATE
  SET display_name     = EXCLUDED.display_name,
      building_color   = EXCLUDED.building_color,
      credits_per_task = EXCLUDED.credits_per_task,
      avg_minutes      = EXCLUDED.avg_minutes,
      default_agents   = EXCLUDED.default_agents,
      description      = EXCLUDED.description;

INSERT INTO companies (workflow_type, name, grid_x, grid_y) VALUES
  ('MK', 'Marketing Crew', 0, 0),
  ('DV', 'Dev Team',       1, 0),
  ('LG', 'Legal Review',   2, 0),
  ('RS', 'Research Lab',   1, 1),
  ('AN', 'Analytics',      2, 1)
ON CONFLICT (workflow_type) DO NOTHING;
