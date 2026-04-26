package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
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

// JWTVerifier hỗ trợ:
//   - ES256 (Supabase Cloud asymmetric keys, lookup qua JWKS)
//   - HS256 (legacy + dev internal-mint, fallback dùng `secret`)
type JWTVerifier struct {
	hs256Secret []byte
	jwks        keyfunc.Keyfunc // có thể nil nếu không cấu hình SUPABASE_URL
}

// NewJWTVerifier khởi tạo verifier. Nếu jwksURL rỗng, chỉ HS256.
func NewJWTVerifier(hs256Secret string, jwksURL string) (*JWTVerifier, error) {
	v := &JWTVerifier{hs256Secret: []byte(hs256Secret)}
	if jwksURL == "" {
		return v, nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	k, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, err
	}
	v.jwks = k
	return v, nil
}

func (v *JWTVerifier) keyFunc(t *jwt.Token) (interface{}, error) {
	switch t.Method.Alg() {
	case "HS256":
		return v.hs256Secret, nil
	case "ES256", "RS256":
		if v.jwks == nil {
			return nil, NewAPIError(http.StatusUnauthorized, "unauthorized", "asymmetric token but JWKS not configured")
		}
		return v.jwks.Keyfunc(t)
	default:
		return nil, NewAPIError(http.StatusUnauthorized, "unauthorized", "unexpected signing method")
	}
}

// SupabaseJWT extracts Authorization: Bearer <jwt>, verifies signature (HS256 or ES256),
// then sets c.Set("user_id", uuid.UUID) + c.Set("jwt_claims", *SupabaseClaims).
func (v *JWTVerifier) Middleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			h := c.Request().Header.Get("Authorization")
			if h == "" || !strings.HasPrefix(h, "Bearer ") {
				return NewAPIError(http.StatusUnauthorized, "unauthorized", "missing bearer token")
			}
			raw := strings.TrimPrefix(h, "Bearer ")

			claims := &SupabaseClaims{}
			tok, err := jwt.ParseWithClaims(raw, claims, v.keyFunc)
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

// SupabaseJWT giữ nguyên signature cũ (chỉ HS256 secret) — backward compat cho main.go cũ.
// Mới: nên dùng NewJWTVerifier + Middleware().
func SupabaseJWT(secret string) echo.MiddlewareFunc {
	v := &JWTVerifier{hs256Secret: []byte(secret)}
	return v.Middleware()
}

func UserID(c echo.Context) uuid.UUID {
	v, _ := c.Get(CtxUserID).(uuid.UUID)
	return v
}
