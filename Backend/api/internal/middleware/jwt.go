package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

const (
	CtxUserID = "user_id"
	CtxClaims = "jwt_claims"
)

type SupabaseClaims struct {
	jwt.RegisteredClaims
	Email        string                 `json:"email"`
	Role         string                 `json:"role"`
	AppMetadata  map[string]interface{} `json:"app_metadata,omitempty"`
	UserMetadata map[string]interface{} `json:"user_metadata,omitempty"`
}

// SupabaseJWT は Authorization: Bearer <jwt> を HS256 で検証し、
// c.Set("user_id", uuid.UUID) と c.Set("jwt_claims", *SupabaseClaims) を埋める。
func SupabaseJWT(secret string) echo.MiddlewareFunc {
	keyFn := func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, NewAPIError(http.StatusUnauthorized, "unauthorized", "unexpected signing method")
		}
		return []byte(secret), nil
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			h := c.Request().Header.Get("Authorization")
			if h == "" || !strings.HasPrefix(h, "Bearer ") {
				return NewAPIError(http.StatusUnauthorized, "unauthorized", "missing bearer token")
			}
			raw := strings.TrimPrefix(h, "Bearer ")

			claims := &SupabaseClaims{}
			tok, err := jwt.ParseWithClaims(raw, claims, keyFn)
			if err != nil || !tok.Valid {
				return NewAPIError(http.StatusUnauthorized, "unauthorized", "invalid token")
			}

			sub, err := claims.GetSubject()
			if err != nil || sub == "" {
				return NewAPIError(http.StatusUnauthorized, "unauthorized", "missing subject")
			}
			uid, err := uuid.Parse(sub)
			if err != nil {
				return NewAPIError(http.StatusUnauthorized, "unauthorized", "subject is not a uuid")
			}

			c.Set(CtxUserID, uid)
			c.Set(CtxClaims, claims)
			return next(c)
		}
	}
}

func UserID(c echo.Context) uuid.UUID {
	v, _ := c.Get(CtxUserID).(uuid.UUID)
	return v
}
