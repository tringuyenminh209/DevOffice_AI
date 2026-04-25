package handler

import (
	"errors"
	"net/http"
	"strconv"

	apimw "github.com/devoffice/api/internal/middleware"
	"github.com/devoffice/api/internal/pkg/envelope"
	"github.com/devoffice/api/internal/repository"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type ApprovalHandler struct {
	repo   *repository.ApprovalRepo
	events *repository.EventRepo
}

func NewApprovalHandler(r *repository.ApprovalRepo, e *repository.EventRepo) *ApprovalHandler {
	return &ApprovalHandler{repo: r, events: e}
}

// GET /api/v1/approvals — list pending của user
func (h *ApprovalHandler) List(c echo.Context) error {
	limit := 20
	if v := c.QueryParam("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	items, err := h.repo.ListPendingByUser(c.Request().Context(), apimw.UserID(c), limit)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(envelope.Page{Items: items}))
}

func (h *ApprovalHandler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid id")
	}
	a, ownerID, err := h.repo.GetWithOwner(c.Request().Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "approval not found")
		}
		return err
	}
	if ownerID != apimw.UserID(c) {
		// Hide existence — chống enumeration
		return apimw.NewAPIError(http.StatusNotFound, "not_found", "approval not found")
	}
	return c.JSON(http.StatusOK, envelope.Data(a))
}

type resolveReq struct {
	Decision      string `json:"decision"`
	RejectionNote string `json:"rejectionNote,omitempty"`
}

func (h *ApprovalHandler) Resolve(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid id")
	}
	var req resolveReq
	if err := c.Bind(&req); err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid body")
	}
	if req.Decision != "approved" && req.Decision != "rejected" {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "decision must be approved|rejected")
	}

	a, err := h.repo.Resolve(c.Request().Context(), repository.ResolveInput{
		ID:            id,
		UserID:        apimw.UserID(c),
		Decision:      req.Decision,
		RejectionNote: req.RejectionNote,
	})
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "approval not found")
		case errors.Is(err, repository.ErrForbidden):
			return apimw.NewAPIError(http.StatusForbidden, "forbidden", "not the task owner")
		case errors.Is(err, repository.ErrConflict):
			return apimw.NewAPIError(http.StatusConflict, "conflict", "approval is not pending")
		}
		return err
	}

	_, _ = h.events.Create(c.Request().Context(), repository.CreateEventInput{
		TaskID:    a.TaskID,
		EventType: "approval.resolved",
		Payload: map[string]any{
			"approvalId": a.ID,
			"decision":   a.Status,
		},
	})

	return c.JSON(http.StatusOK, envelope.Data(a))
}
