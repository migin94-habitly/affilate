package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type contextKey string

const (
	PartnerIDKey contextKey = "partner_id"
	AdminIDKey   contextKey = "admin_id"
	AdminRoleKey contextKey = "admin_role"
)

type Claims struct {
	jwt.RegisteredClaims
	Subject string `json:"sub"`
	Role    string `json:"role,omitempty"`
	Type    string `json:"type"` // "partner" | "admin"
}

func RequirePartner(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := extractClaims(r, secret)
			if err != nil || claims.Type != "partner" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			id, err := uuid.Parse(claims.Subject)
			if err != nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), PartnerIDKey, id)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireAdmin(secret string, roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := extractClaims(r, secret)
			if err != nil || claims.Type != "admin" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			if len(roles) > 0 {
				allowed := false
				for _, role := range roles {
					if claims.Role == role || claims.Role == "super_admin" {
						allowed = true
						break
					}
				}
				if !allowed {
					http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
					return
				}
			}
			id, err := uuid.Parse(claims.Subject)
			if err != nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), AdminIDKey, id)
			ctx = context.WithValue(ctx, AdminRoleKey, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func extractClaims(r *http.Request, secret string) (*Claims, error) {
	authHeader := r.Header.Get("Authorization")
	tokenStr := ""
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
	}
	if tokenStr == "" {
		return nil, jwt.ErrTokenMalformed
	}
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	return claims, err
}

func GetPartnerID(ctx context.Context) uuid.UUID {
	id, _ := ctx.Value(PartnerIDKey).(uuid.UUID)
	return id
}

func GetAdminID(ctx context.Context) uuid.UUID {
	id, _ := ctx.Value(AdminIDKey).(uuid.UUID)
	return id
}

func GetAdminRole(ctx context.Context) string {
	role, _ := ctx.Value(AdminRoleKey).(string)
	return role
}
