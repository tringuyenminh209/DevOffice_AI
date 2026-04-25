// Package devworker: in-process simulation of the AI worker (Go port of worker/app/simulator.py).
// 用途: dev 環境で Python worker を立てたくない場合の代替。
// 本番では使用禁止 — 本物の Python+CrewAI worker に enqueue する。
package devworker

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/devoffice/api/internal/repository"
	"github.com/devoffice/api/internal/storage"
	"github.com/google/uuid"
)

type Agent struct {
	ID   string
	Role string
}

var workflowAgents = map[string][]Agent{
	"MK": {{"researcher", "Researcher"}, {"copywriter", "Copywriter"}, {"designer", "Designer"}, {"approver", "Approver"}},
	"DV": {{"planner", "Planner"}, {"coder", "Coder"}, {"reviewer", "Reviewer"}, {"qa", "QA"}},
	"LG": {{"analyst", "Analyst"}, {"researcher", "Researcher"}, {"reviewer", "Reviewer"}},
	"RS": {{"researcher_1", "Researcher"}, {"researcher_2", "Researcher"}, {"writer", "Writer"}, {"reviewer", "Reviewer"}},
	"AN": {{"analyst", "Analyst"}, {"visualizer", "Visualizer"}, {"reporter", "Reporter"}},
}

var tools = []string{"search", "read_file", "write_draft", "review"}

type Simulator struct {
	tasks     *repository.TaskRepo
	events    *repository.EventRepo
	approvals *repository.ApprovalRepo
	storage   *storage.Client
	bucket    string
	totalSecs int
}

type Config struct {
	Tasks            *repository.TaskRepo
	Events           *repository.EventRepo
	Approvals        *repository.ApprovalRepo
	Storage          *storage.Client
	Bucket           string
	SimulationSecs   int
}

func New(cfg Config) *Simulator {
	if cfg.SimulationSecs <= 0 {
		cfg.SimulationSecs = 12
	}
	return &Simulator{
		tasks:     cfg.Tasks,
		events:    cfg.Events,
		approvals: cfg.Approvals,
		storage:   cfg.Storage,
		bucket:    cfg.Bucket,
		totalSecs: cfg.SimulationSecs,
	}
}

type Job struct {
	TaskID       uuid.UUID
	UserID       uuid.UUID
	WorkflowType string
	Brief        string
}

// Enqueue spawns a goroutine running the simulation. Errors are logged only —
// task vẫn ở queued/running cho đến khi simulation hoàn tất hoặc fail.
func (s *Simulator) Enqueue(j Job) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		if err := s.run(ctx, j); err != nil {
			log.Printf("devworker [%s]: %v", j.TaskID, err)
			_, _ = s.tasks.MarkFailed(ctx, j.TaskID, fmt.Sprintf("simulator crashed: %v", err))
		}
	}()
}

func (s *Simulator) run(ctx context.Context, j Job) error {
	agents, ok := workflowAgents[j.WorkflowType]
	if !ok {
		agents = workflowAgents["MK"]
	}
	total := s.totalSecs
	if min := len(agents) * 2; total < min {
		total = min
	}
	perAgent := time.Duration(total) * time.Second / time.Duration(len(agents))

	log.Printf("devworker [%s]: starting %s (%ds, %d agents)", j.TaskID, j.WorkflowType, total, len(agents))

	if err := s.emit(ctx, j.TaskID, "task.started", "", map[string]any{"workflowType": j.WorkflowType}); err != nil {
		return err
	}
	if err := s.tasks.MarkRunning(ctx, j.TaskID); err != nil {
		return err
	}

	for _, ag := range agents {
		if err := s.emit(ctx, j.TaskID, "agent.state", ag.ID, map[string]any{"state": "thinking"}); err != nil {
			return err
		}
		s.sleep(ctx, perAgent*4/10)

		tool := tools[rand.Intn(len(tools))]
		hint := j.Brief
		if len(hint) > 60 {
			hint = hint[:60]
		}
		if err := s.emit(ctx, j.TaskID, "agent.tool_call", ag.ID, map[string]any{
			"tool": tool, "args": map[string]any{"hint": hint},
		}); err != nil {
			return err
		}
		s.sleep(ctx, perAgent*5/10)

		if err := s.emit(ctx, j.TaskID, "agent.state", ag.ID, map[string]any{"state": "idle"}); err != nil {
			return err
		}
		s.sleep(ctx, perAgent/10)

		// Demo: 30% xác suất bắn approval gate trước approver/reviewer
		if (ag.ID == "approver" || ag.ID == "reviewer") && rand.Float64() < 0.3 {
			if err := s.fireApproval(ctx, j.TaskID); err != nil {
				log.Printf("devworker [%s]: approval gate failed: %v", j.TaskID, err)
			}
			// demo: 2 giây giả lập user phản ứng
			s.sleep(ctx, 2*time.Second)
		}
	}

	// resultUrl 渡さず → MarkCompleted の後に handler が auto-upload するのと同じ機構を使う
	// 現状 devworker は repo を直接呼ぶのでここで upload する。Phase E で内部 HTTP に変更可。
	resultURL, resultType, err := s.uploadResult(ctx, j)
	if err != nil {
		log.Printf("devworker [%s]: upload result failed (using stub URL): %v", j.TaskID, err)
		stub := fmt.Sprintf("https://example.com/results/%s.html", j.TaskID)
		resultURL = stub
		resultType = "html"
	}

	if _, err := s.tasks.MarkCompleted(ctx, repository.CompleteTaskInput{
		TaskID:     j.TaskID,
		ResultURL:  &resultURL,
		ResultType: &resultType,
	}); err != nil {
		return err
	}
	if err := s.emit(ctx, j.TaskID, "task.completed", "", map[string]any{
		"resultUrl": resultURL, "resultType": resultType,
	}); err != nil {
		return err
	}
	log.Printf("devworker [%s]: completed", j.TaskID)
	return nil
}

func (s *Simulator) emit(ctx context.Context, taskID uuid.UUID, eventType, agentID string, payload map[string]any) error {
	var ag *string
	if agentID != "" {
		ag = &agentID
	}
	_, err := s.events.Create(ctx, repository.CreateEventInput{
		TaskID: taskID, AgentID: ag, EventType: eventType, Payload: payload,
	})
	return err
}

func (s *Simulator) fireApproval(ctx context.Context, taskID uuid.UUID) error {
	a, err := s.approvals.Create(ctx, repository.CreateApprovalInput{
		TaskID:     taskID,
		ActionName: "publish_artifact",
		ActionPayload: map[string]any{
			"target": "production",
			"summary": "demo approval gate from devworker",
		},
		RiskLevel: "MEDIUM",
	})
	if err != nil {
		return err
	}
	return s.emit(ctx, taskID, "approval.required", "", map[string]any{
		"approvalId": a.ID, "actionName": a.ActionName, "riskLevel": a.RiskLevel,
	})
}

func (s *Simulator) uploadResult(ctx context.Context, j Job) (string, string, error) {
	html := fmt.Sprintf(`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>DevOffice AI — Result</title>
<style>body{font-family:system-ui;max-width:720px;margin:40px auto;padding:0 20px;background:#0C0D12;color:#E5E7EB}
h1{color:#5E55EA}h2{color:#10B06B}pre{background:#15171F;padding:12px;border-radius:8px;overflow:auto}
.brief{padding:14px;background:#1D202B;border-left:4px solid #5E55EA;margin:16px 0}</style>
</head><body>
<h1>%s task result</h1>
<p>Task ID: <code>%s</code></p>
<div class="brief"><strong>Brief</strong><br>%s</div>
<h2>Status</h2><pre>completed at %s
agents: %s
generated by: devworker (in-process simulator)</pre>
<p>Phase D で本物の CrewAI 出力に置換予定。</p>
</body></html>`,
		j.WorkflowType, j.TaskID, escapeHTML(j.Brief), time.Now().Format(time.RFC3339), agentsList(j.WorkflowType))

	if s.storage.Disabled() {
		return "", "", fmt.Errorf("storage disabled")
	}
	path := fmt.Sprintf("%s/%s.html", j.UserID, j.TaskID)
	storagePath, err := s.storage.Upload(ctx, s.bucket, path, "text/html", []byte(html))
	if err != nil {
		return "", "", err
	}
	return storagePath, "html", nil
}

func (s *Simulator) sleep(ctx context.Context, d time.Duration) {
	if d <= 0 {
		return
	}
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
	case <-t.C:
	}
}

func escapeHTML(s string) string {
	out := make([]byte, 0, len(s))
	for _, r := range s {
		switch r {
		case '<':
			out = append(out, []byte("&lt;")...)
		case '>':
			out = append(out, []byte("&gt;")...)
		case '&':
			out = append(out, []byte("&amp;")...)
		default:
			out = append(out, []byte(string(r))...)
		}
	}
	return string(out)
}

func agentsList(wt string) string {
	ags := workflowAgents[wt]
	parts := make([]string, 0, len(ags))
	for _, a := range ags {
		parts = append(parts, a.Role)
	}
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += ", "
		}
		out += p
	}
	return out
}
