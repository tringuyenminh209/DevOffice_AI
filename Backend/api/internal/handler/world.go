package handler

import (
	"net/http"

	"github.com/devoffice/api/internal/domain"
	"github.com/devoffice/api/internal/pkg/envelope"
	"github.com/devoffice/api/internal/repository"
	"github.com/labstack/echo/v4"
)

type WorldHandler struct {
	companies *repository.CompanyRepo
}

func NewWorldHandler(c *repository.CompanyRepo) *WorldHandler {
	return &WorldHandler{companies: c}
}

func (h *WorldHandler) Snapshot(c echo.Context) error {
	cs, err := h.companies.List(c.Request().Context())
	if err != nil {
		return err
	}
	snap := domain.WorldSnapshot{
		Companies: cs,
		Messages:  []any{},
	}
	return c.JSON(http.StatusOK, envelope.Data(snap))
}
