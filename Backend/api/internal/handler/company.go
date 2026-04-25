package handler

import (
	"errors"
	"net/http"

	apimw "github.com/devoffice/api/internal/middleware"
	"github.com/devoffice/api/internal/pkg/envelope"
	"github.com/devoffice/api/internal/repository"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type CompanyHandler struct {
	repo *repository.CompanyRepo
}

func NewCompanyHandler(r *repository.CompanyRepo) *CompanyHandler {
	return &CompanyHandler{repo: r}
}

func (h *CompanyHandler) List(c echo.Context) error {
	items, err := h.repo.List(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(map[string]any{"companies": items}))
}

func (h *CompanyHandler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return apimw.NewAPIError(http.StatusBadRequest, "bad_request", "invalid company id")
	}
	detail, err := h.repo.Get(c.Request().Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return apimw.NewAPIError(http.StatusNotFound, "not_found", "company not found")
		}
		return err
	}
	return c.JSON(http.StatusOK, envelope.Data(detail))
}
