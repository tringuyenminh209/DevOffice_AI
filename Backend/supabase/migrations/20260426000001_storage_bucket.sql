-- Storage bucket: task-results
-- Private (signed URL only), 5 MiB file limit, HTML/PDF/text/binary 全部受け入れ
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-results',
  'task-results',
  false,
  5242880,
  ARRAY['text/html','text/plain','application/pdf','application/json','image/png','image/jpeg','application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy: タスクオーナーのみ自分の result を読む。
-- パス命名規約: {user_id}/{task_id}.html
CREATE POLICY "task results owner read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-results'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
