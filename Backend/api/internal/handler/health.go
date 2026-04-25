package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/devoffice/api/internal/pkg/envelope"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type HealthHandler struct {
	pool *pgxpool.Pool
}

func NewHealthHandler(p *pgxpool.Pool) *HealthHandler { return &HealthHandler{pool: p} }

func (h *HealthHandler) Liveness(c echo.Context) error {
	return c.JSON(http.StatusOK, envelope.Data(map[string]string{"status": "ok"}))
}

func (h *HealthHandler) Readiness(c echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 2*time.Second)
	defer cancel()
	if err := h.pool.Ping(ctx); err != nil {
		return c.JSON(http.StatusServiceUnavailable, envelope.Error("db_unreachable", err.Error()))
	}
	return c.JSON(http.StatusOK, envelope.Data(map[string]string{"status": "ready"}))
}
