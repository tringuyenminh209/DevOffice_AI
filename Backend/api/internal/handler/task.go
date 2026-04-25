package handler

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/devoffice/api/internal/devworker"
	apimw "github.com/devoffice/api/internal/middleware"
	"github.com/devoffice/api/internal/pkg/envelope"
	"github.com/devoffice/api/internal/repository"
	"github.com/devoffice/api/internal/storage"
	"github.com/devoffice/api/internal/worker"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type TaskHandler struct {
	tasks       *repository.TaskRepo
	companies   *repository.CompanyRepo
	events      *repository.EventRepo
	worker      *worker.Client
	devSim      *devworker.Simulator
	storage     *storage.Client
	bucket      string
}

type TaskHandlerDeps struct {
	Tasks     *repository.TaskRepo
	Companies *repository.CompanyRepo
	Events    *repository.EventRepo
	Worker    *worker.Client
	DevSim    *devworker.Simulator
	Storage   *storage.Client
	Bucket    string
}

func NewTaskHandler(d TaskHandlerDeps) *TaskHandler {
	return &TaskHandler{
		tasks: d.Tasks, companies: d.Companies, events: d.Events,
		worker: d.Worker, devSim: d.DevSim, storage: d.Storage, bucket: d.Bucket,
	}
}

type createTaskRequest struct {
	CompanyID string `json:"companyId"`
	Brief     string `json:"brief"`
}

func (h *TaskHandler) Create(c echo.Context) error {
	var req createTaskRequest
	if err := c.Bind(&req); err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid json body")
	}
	companyID, err := uuid.Parse(req.CompanyID)
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid companyId")
	}
	brief := strings.TrimSpace(req.Brief)
	if brief == "" || len(brief) > 4000 {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "brief must be 1..4000 chars")
	}

	t, err := h.tasks.Create(c.Request().Context(), repository.CreateTaskInput{
		UserID:    apimw.UserID(c),
		CompanyID: companyID,
		Brief:     brief,
	})
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "company or user not found")
		case errors.Is(err, repository.ErrInsufficientCredits):
			return apimw.NewAPIError(http.StatusPaymentRequired, "insufficient_credits", "not enough credits")
		}
		return err
	}

	// Enqueue to worker. Branch:
	//   - devSim != nil  → in-process Go simulator (DEV_INPROCESS_WORKER=true)
	//   - else           → HTTP best-effort to Python worker
	go func(taskID, userID, companyID uuid.UUID, brief string) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		company, err := h.companies.Get(ctx, companyID)
		if err != nil {
			log.Printf("enqueue: company lookup failed: %v", err)
			return
		}

		if h.devSim != nil {
			h.devSim.Enqueue(devworker.Job{
				TaskID:       taskID,
				UserID:       userID,
				WorkflowType: company.WorkflowType,
				Brief:        brief,
			})
			return
		}
		if h.worker == nil {
			return
		}
		if err := h.worker.Enqueue(ctx, worker.EnqueueRequest{
			TaskID:       taskID,
			UserID:       userID,
			CompanyID:    companyID,
			WorkflowType: company.WorkflowType,
			Brief:        brief,
		}); err != nil {
			log.Printf("worker enqueue: %v", err)
		}
	}(t.ID, t.UserID, t.CompanyID, t.Brief)

	return c.JSON(http.StatusCreated, envelope.Data(t))
}

func (h *TaskHandler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid task id")
	}
	t, err := h.tasks.Get(c.Request().Context(), apimw.UserID(c), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "task not found")
		}
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(t))
}

// GET /api/v1/tasks/:id/events — Realtime reconnect 後のバックフィル
func (h *TaskHandler) Events(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid task id")
	}
	// Owner check qua tasks.Get (returns ErrNotFound nếu không phải owner)
	if _, err := h.tasks.Get(c.Request().Context(), apimw.UserID(c), id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "task not found")
		}
		return err
	}
	limit := 100
	if v := c.QueryParam("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	items, err := h.events.ListByTask(c.Request().Context(), id, limit)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(envelope.Page{Items: items}))
}

// GET /api/v1/tasks/:id/result — 成果物 URL
// Phase C stub: result_url が S3 presigned URL に置換されるまで、保存値を直接返す。
// Phase D で aws-sdk-go-v2/s3 + GetObject presign に置換。
func (h *TaskHandler) Result(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid task id")
	}
	t, err := h.tasks.Get(c.Request().Context(), apimw.UserID(c), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "task not found")
		}
		return err
	}
	if t.Status != "completed" || t.ResultURL == nil {
		return apimw.NewAPIError(http.StatusConflict, "conflict", "task has no result yet")
	}

	resultURL := *t.ResultURL
	expiresIn := 900

	// result_url が "{bucket}/{path}" 形式（storage path）→ signed URL に変換
	// http(s):// で始まる場合は外部 URL（stub）→ そのまま返す
	if h.storage != nil && !h.storage.Disabled() &&
		!strings.HasPrefix(resultURL, "http://") && !strings.HasPrefix(resultURL, "https://") {
		bucket, objectPath, found := strings.Cut(resultURL, "/")
		if found {
			signed, err := h.storage.SignURL(c.Request().Context(), bucket, objectPath, expiresIn)
			if err != nil {
				log.Printf("storage sign: %v", err)
				return apimw.NewAPIError(http.StatusBadGateway, "storage_unavailable", "could not sign result url")
			}
			resultURL = signed
		}
	}

	return c.JSON(http.StatusOK, envelope.Data(map[string]any{
		"taskId":     t.ID,
		"resultUrl":  resultURL,
		"resultType": t.ResultType,
		"expiresIn":  expiresIn,
	}))
}

func (h *TaskHandler) List(c echo.Context) error {
	limit := 20
	if v := c.QueryParam("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	items, err := h.tasks.List(c.Request().Context(), repository.ListTasksInput{
		UserID: apimw.UserID(c),
		Limit:  limit,
	})
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(envelope.Page{Items: items}))
}
