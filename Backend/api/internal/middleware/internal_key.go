package middleware

import (
	"crypto/subtle"
	"net/http"

	"github.com/labstack/echo/v4"
)

// InternalKey は X-Internal-Key ヘッダーで Worker → Go API 内部通信を認証する。
// 定数時間比較で timing attack 対策。
func InternalKey(expected string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			got := c.Request().Header.Get("X-Internal-Key")
			if got == "" || subtle.ConstantTimeCompare([]byte(got), []byte(expected)) != 1 {
				return NewAPIError(http.StatusUnauthorized, "unauthorized", "invalid internal key")
			}
			return next(c)
		}
	}
}
