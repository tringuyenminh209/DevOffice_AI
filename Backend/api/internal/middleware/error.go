package middleware

import (
	"errors"
	"net/http"

	"github.com/devoffice/api/internal/pkg/envelope"
	"github.com/labstack/echo/v4"
)

type APIError struct {
	HTTPStatus int
	Code       string
	Message    string
}

func (e *APIError) Error() string { return e.Message }

func NewAPIError(status int, code, msg string) *APIError {
	return &APIError{HTTPStatus: status, Code: code, Message: msg}
}

func ErrorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}

	var apiErr *APIError
	if errors.As(err, &apiErr) {
		_ = c.JSON(apiErr.HTTPStatus, envelope.Error(apiErr.Code, apiErr.Message))
		return
	}

	var he *echo.HTTPError
	if errors.As(err, &he) {
		code := codeForStatus(he.Code)
		msg, _ := he.Message.(string)
		if msg == "" {
			msg = http.StatusText(he.Code)
		}
		_ = c.JSON(he.Code, envelope.Error(code, msg))
		return
	}

	c.Logger().Error(err)
	_ = c.JSON(http.StatusInternalServerError, envelope.Error("internal_error", "internal server error"))
}

func codeForStatus(s int) string {
	switch s {
	case http.StatusBadRequest:
		return "bad_request"
	case http.StatusUnauthorized:
		return "unauthorized"
	case http.StatusForbidden:
		return "forbidden"
	case http.StatusNotFound:
		return "not_found"
	case http.StatusConflict:
		return "conflict"
	case http.StatusPaymentRequired:
		return "payment_required"
	case http.StatusTooManyRequests:
		return "rate_limited"
	default:
		return "internal_error"
	}
}
