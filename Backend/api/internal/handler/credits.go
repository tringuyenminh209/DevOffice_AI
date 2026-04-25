package handler

import (
	"errors"
	"net/http"
	"strconv"

	apimw "github.com/devoffice/api/internal/middleware"
	"github.com/devoffice/api/internal/pkg/envelope"
	"github.com/devoffice/api/internal/repository"
	"github.com/labstack/echo/v4"
)

type CreditsHandler struct {
	repo    *repository.CreditsRepo
	devMode bool
}

func NewCreditsHandler(r *repository.CreditsRepo, devMode bool) *CreditsHandler {
	return &CreditsHandler{repo: r, devMode: devMode}
}

func (h *CreditsHandler) Balance(c echo.Context) error {
	b, err := h.repo.GetBalance(c.Request().Context(), apimw.UserID(c))
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "user profile not found")
		}
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(b))
}

// POST /api/v1/credits/dev-grant — dev only。本番では無効。
// Body: { "amount": 100 } (default 100, max 10000)
type devGrantReq struct {
	Amount int `json:"amount"`
}

func (h *CreditsHandler) DevGrant(c echo.Context) error {
	if !h.devMode {
		return apimw.NewAPIError(http.StatusForbidden, "forbidden", "dev grant disabled (set DEV_MODE=true)")
	}
	var req devGrantReq
	_ = c.Bind(&req)
	if req.Amount <= 0 {
		req.Amount = 100
	}
	if req.Amount > 10000 {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "amount too large")
	}
	b, err := h.repo.DevGrant(c.Request().Context(), apimw.UserID(c), req.Amount)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(b))
}

func (h *CreditsHandler) Transactions(c echo.Context) error {
	limit := 20
	if v := c.QueryParam("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	items, err := h.repo.ListTransactions(c.Request().Context(), apimw.UserID(c), limit)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(envelope.Page{Items: items}))
}
