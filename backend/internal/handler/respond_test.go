package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
)

func TestJSON_SetsContentTypeAndStatus(t *testing.T) {
	w := httptest.NewRecorder()
	handler.JSON(w, http.StatusOK, map[string]string{"status": "ok"})

	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}
	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("body status = %q, want ok", body["status"])
	}
}

func TestError_NotFound(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrNotFound)
	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", w.Code)
	}
}

func TestError_AlreadyExists(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrAlreadyExists)
	if w.Code != http.StatusConflict {
		t.Errorf("status = %d, want 409", w.Code)
	}
}

func TestError_InvalidCredentials(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrInvalidCredentials)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestError_Unauthorized(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrUnauthorized)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestError_Forbidden(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrForbidden)
	if w.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403", w.Code)
	}
}

func TestError_InsufficientBalance(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrInsufficientBalance)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestError_BelowMinThreshold(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrBelowMinThreshold)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestError_KYCNotVerified(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrKYCNotVerified)
	if w.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403", w.Code)
	}
}

func TestError_PartnerSuspended(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrPartnerSuspended)
	if w.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403", w.Code)
	}
}

func TestParseJSON_ValidBody(t *testing.T) {
	body := strings.NewReader(`{"email":"test@example.com","password":"pass"}`)
	r := httptest.NewRequest(http.MethodPost, "/", body)
	r.Header.Set("Content-Type", "application/json")

	var dst struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := handler.ParseJSON(r, &dst); err != nil {
		t.Fatalf("ParseJSON error: %v", err)
	}
	if dst.Email != "test@example.com" {
		t.Errorf("Email = %q, want test@example.com", dst.Email)
	}
}

func TestParseJSON_UnknownField(t *testing.T) {
	body := strings.NewReader(`{"email":"x@y.com","unknown_field":"value"}`)
	r := httptest.NewRequest(http.MethodPost, "/", body)
	var dst struct {
		Email string `json:"email"`
	}
	if err := handler.ParseJSON(r, &dst); err == nil {
		t.Error("expected error for unknown field with DisallowUnknownFields, got nil")
	}
}

func TestIntQuery_ValidValue(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/?page=3", nil)
	if v := handler.IntQuery(r, "page", 1); v != 3 {
		t.Errorf("IntQuery = %d, want 3", v)
	}
}

func TestIntQuery_MissingKey_Fallback(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	if v := handler.IntQuery(r, "page", 1); v != 1 {
		t.Errorf("IntQuery fallback = %d, want 1", v)
	}
}

func TestIntQuery_ZeroValue_Fallback(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/?per_page=0", nil)
	if v := handler.IntQuery(r, "per_page", 20); v != 20 {
		t.Errorf("IntQuery with 0 value = %d, want fallback 20", v)
	}
}

func TestIntQuery_NonNumeric_Fallback(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/?page=abc", nil)
	if v := handler.IntQuery(r, "page", 5); v != 5 {
		t.Errorf("IntQuery with non-numeric = %d, want fallback 5", v)
	}
}
