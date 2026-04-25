// Internal API: AI Worker → Go API. X-Internal-Key で認証済み（middleware）。
// Realtime broadcast は Supabase postgres_changes に依存（task_events INSERT で frontend が自動受信）。

package handler

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	apimw "github.com/devoffice/api/internal/middleware"
	"github.com/devoffice/api/internal/pkg/envelope"
	"github.com/devoffice/api/internal/repository"
	"github.com/devoffice/api/internal/storage"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type InternalHandler struct {
	tasks     *repository.TaskRepo
	events    *repository.EventRepo
	approvals *repository.ApprovalRepo
	storage   *storage.Client
	bucket    string
}

func NewInternalHandler(t *repository.TaskRepo, e *repository.EventRepo, a *repository.ApprovalRepo, s *storage.Client, bucket string) *InternalHandler {
	return &InternalHandler{tasks: t, events: e, approvals: a, storage: s, bucket: bucket}
}

// POST /internal/tasks/:id/event
type postEventReq struct {
	AgentID   *string        `json:"agentId,omitempty"`
	EventType string         `json:"eventType"`
	Payload   map[string]any `json:"payload,omitempty"`
}

func (h *InternalHandler) PostEvent(c echo.Context) error {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid task id")
	}
	var req postEventReq
	if err := c.Bind(&req); err != nil || req.EventType == "" {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid event body")
	}

	// task.started イベントなら status=running に遷移（idempotent）
	if req.EventType == "task.started" {
		if err := h.tasks.MarkRunning(c.Request().Context(), taskID); err != nil {
			return err
		}
	}

	ev, err := h.events.Create(c.Request().Context(), repository.CreateEventInput{
		TaskID:    taskID,
		AgentID:   req.AgentID,
		EventType: req.EventType,
		Payload:   req.Payload,
	})
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, envelope.Data(ev))
}

// POST /internal/tasks/:id/complete
type postCompleteReq struct {
	ResultURL  *string `json:"resultUrl,omitempty"`
	ResultType *string `json:"resultType,omitempty"`
}

func (h *InternalHandler) PostComplete(c echo.Context) error {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid task id")
	}
	var req postCompleteReq
	if err := c.Bind(&req); err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid body")
	}

	// resultUrl が空 → 自動でプレースホルダー HTML を Supabase Storage に upload
	if (req.ResultURL == nil || *req.ResultURL == "") && !h.storage.Disabled() {
		path, ct, err := h.uploadPlaceholder(c, taskID)
		if err != nil {
			log.Printf("internal complete: placeholder upload failed: %v", err)
		} else {
			req.ResultURL = &path
			req.ResultType = &ct
		}
	}

	t, err := h.tasks.MarkCompleted(c.Request().Context(), repository.CompleteTaskInput{
		TaskID:     taskID,
		ResultURL:  req.ResultURL,
		ResultType: req.ResultType,
	})
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "task not found or already terminal")
		}
		return err
	}

	_, _ = h.events.Create(c.Request().Context(), repository.CreateEventInput{
		TaskID:    taskID,
		EventType: "task.completed",
		Payload:   map[string]any{"resultUrl": req.ResultURL, "resultType": req.ResultType},
	})

	return c.JSON(http.StatusOK, envelope.Data(t))
}

// POST /internal/tasks/:id/fail
type postFailReq struct {
	ErrorMessage string `json:"errorMessage"`
}

func (h *InternalHandler) PostFail(c echo.Context) error {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid task id")
	}
	var req postFailReq
	if err := c.Bind(&req); err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid body")
	}
	if req.ErrorMessage == "" {
		req.ErrorMessage = "task failed"
	}

	t, err := h.tasks.MarkFailed(c.Request().Context(), taskID, req.ErrorMessage)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "task not found")
		}
		return err
	}

	_, _ = h.events.Create(c.Request().Context(), repository.CreateEventInput{
		TaskID:    taskID,
		EventType: "task.failed",
		Payload:   map[string]any{"errorMessage": req.ErrorMessage},
	})

	return c.JSON(http.StatusOK, envelope.Data(t))
}

// POST /internal/approvals
type postApprovalReq struct {
	TaskID        string         `json:"taskId"`
	ActionName    string         `json:"actionName"`
	ActionPayload map[string]any `json:"actionPayload"`
	RiskLevel     string         `json:"riskLevel"`
}

func (h *InternalHandler) PostApproval(c echo.Context) error {
	var req postApprovalReq
	if err := c.Bind(&req); err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid body")
	}
	taskID, err := uuid.Parse(req.TaskID)
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid taskId")
	}
	switch req.RiskLevel {
	case "LOW", "MEDIUM", "HIGH":
	default:
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "riskLevel must be LOW|MEDIUM|HIGH")
	}
	if req.ActionName == "" {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "actionName required")
	}

	a, err := h.approvals.Create(c.Request().Context(), repository.CreateApprovalInput{
		TaskID:        taskID,
		ActionName:    req.ActionName,
		ActionPayload: req.ActionPayload,
		RiskLevel:     req.RiskLevel,
	})
	if err != nil {
		return err
	}

	_, _ = h.events.Create(c.Request().Context(), repository.CreateEventInput{
		TaskID:    taskID,
		EventType: "approval.required",
		Payload: map[string]any{
			"approvalId": a.ID,
			"actionName": a.ActionName,
			"riskLevel":  a.RiskLevel,
		},
	})

	return c.JSON(http.StatusCreated, envelope.Data(a))
}

// uploadPlaceholder は task の brief / company / agents 情報を埋め込んだ HTML を生成し
// `task-results/{user_id}/{task_id}.html` に保存。storage path を返す。
func (h *InternalHandler) uploadPlaceholder(c echo.Context, taskID uuid.UUID) (string, string, error) {
	// Internal endpoint は user JWT なし → admin context で task を取得
	ctx := c.Request().Context()
	row := struct {
		UserID       uuid.UUID
		Brief        string
		WorkflowType string
		CompanyName  string
	}{}
	err := h.tasks.GetForInternal(ctx, taskID, &row.UserID, &row.Brief, &row.WorkflowType, &row.CompanyName)
	if err != nil {
		return "", "", err
	}

	html := fmt.Sprintf(`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>DevOffice AI — %s Result</title>
<style>body{font-family:system-ui;max-width:720px;margin:40px auto;padding:0 20px;background:#0C0D12;color:#E5E7EB}
h1{color:#5E55EA}h2{color:#10B06B}pre{background:#15171F;padding:12px;border-radius:8px;overflow:auto}
.brief{padding:14px;background:#1D202B;border-left:4px solid #5E55EA;margin:16px 0}
small{color:#94a3b8}</style>
</head><body>
<h1>%s — Task Result</h1>
<p><small>Task ID: <code>%s</code> · Workflow: <code>%s</code> · Generated: %s</small></p>
<div class="brief"><strong>Brief</strong><br>%s</div>
<h2>Status</h2><pre>completed
generated by: AI worker
storage: Supabase (signed URL, 15 min TTL)</pre>
<p><em>Phase E でこの HTML が CrewAI 出力（実際の成果物）に置換されます。</em></p>
</body></html>`,
		row.CompanyName, row.CompanyName, taskID, row.WorkflowType,
		time.Now().Format(time.RFC3339), htmlEscape(row.Brief))

	path := fmt.Sprintf("%s/%s.html", row.UserID, taskID)
	storedPath, err := h.storage.Upload(ctx, h.bucket, path, "text/html", []byte(html))
	if err != nil {
		return "", "", err
	}
	return storedPath, "html", nil
}

func htmlEscape(s string) string {
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

// GET /internal/approvals/:id — Worker が承認結果をポーリング
func (h *InternalHandler) GetApproval(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid id")
	}
	a, err := h.approvals.Get(c.Request().Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "approval not found")
		}
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(a))
}
