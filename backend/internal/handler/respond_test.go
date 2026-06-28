package handler_test

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
)

// --- JSON helper tests ---

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

func TestJSON_StatusCreated(t *testing.T) {
	w := httptest.NewRecorder()
	handler.JSON(w, http.StatusCreated, map[string]string{"id": "abc123"})
	if w.Code != http.StatusCreated {
		t.Errorf("status = %d, want 201", w.Code)
	}
}

func TestJSON_NilData_WritesNull(t *testing.T) {
	w := httptest.NewRecorder()
	handler.JSON(w, http.StatusOK, nil)
	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}
	body := strings.TrimSpace(w.Body.String())
	if body != "null" {
		t.Errorf("body = %q, want null", body)
	}
}

func TestJSON_ArrayData(t *testing.T) {
	w := httptest.NewRecorder()
	handler.JSON(w, http.StatusOK, []int{1, 2, 3})
	var out []int
	if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
		t.Fatalf("body is not valid JSON array: %v", err)
	}
	if len(out) != 3 {
		t.Errorf("array len = %d, want 3", len(out))
	}
}

// --- Error mapping tests ---

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

func TestError_InvalidInput_ContainsMessage(t *testing.T) {
	w := httptest.NewRecorder()
	// ErrInvalidInput wrapping preserves the original message
	err := fmt.Errorf("%w: email is required", domain.ErrInvalidInput)
	handler.Error(w, err)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
	var body map[string]string
	if jsonErr := json.Unmarshal(w.Body.Bytes(), &body); jsonErr != nil {
		t.Fatalf("body is not JSON: %v", jsonErr)
	}
	if !strings.Contains(body["error"], "email is required") {
		t.Errorf("error body = %q, expected to contain message", body["error"])
	}
}

func TestError_UnknownError_Returns500(t *testing.T) {
	w := httptest.NewRecorder()
	handler.Error(w, errors.New("something unexpected happened"))
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", w.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("body is not JSON: %v", err)
	}
	if body["error"] != "internal server error" {
		t.Errorf("error = %q, want 'internal server error'", body["error"])
	}
}

func TestError_OfferNotAccepted_Returns500(t *testing.T) {
	// ErrOfferNotAccepted has no specific HTTP mapping → should return 500
	w := httptest.NewRecorder()
	handler.Error(w, domain.ErrOfferNotAccepted)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500 (no handler for ErrOfferNotAccepted)", w.Code)
	}
}

func TestError_ResponseIsAlwaysJSON(t *testing.T) {
	errs := []error{
		domain.ErrNotFound,
		domain.ErrAlreadyExists,
		domain.ErrInvalidCredentials,
		domain.ErrUnauthorized,
		domain.ErrForbidden,
		domain.ErrBelowMinThreshold,
		domain.ErrInsufficientBalance,
		domain.ErrKYCNotVerified,
		domain.ErrPartnerSuspended,
		errors.New("unknown"),
	}
	for _, err := range errs {
		w := httptest.NewRecorder()
		handler.Error(w, err)
		if ct := w.Header().Get("Content-Type"); ct != "application/json" {
			t.Errorf("error %v: Content-Type = %q, want application/json", err, ct)
		}
		var body map[string]string
		if jsonErr := json.Unmarshal(w.Body.Bytes(), &body); jsonErr != nil {
			t.Errorf("error %v: body is not valid JSON: %v", err, jsonErr)
		}
		if _, ok := body["error"]; !ok {
			t.Errorf("error %v: response missing 'error' field", err)
		}
	}
}

// --- ParseJSON tests ---

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

func TestParseJSON_MalformedJSON(t *testing.T) {
	body := strings.NewReader(`{not valid json`)
	r := httptest.NewRequest(http.MethodPost, "/", body)
	var dst struct {
		Email string `json:"email"`
	}
	if err := handler.ParseJSON(r, &dst); err == nil {
		t.Error("expected error for malformed JSON, got nil")
	}
}

func TestParseJSON_EmptyBody(t *testing.T) {
	body := strings.NewReader(``)
	r := httptest.NewRequest(http.MethodPost, "/", body)
	var dst struct{ Email string }
	if err := handler.ParseJSON(r, &dst); err == nil {
		t.Error("expected error for empty body, got nil")
	}
}

// --- IntQuery tests ---

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

func TestIntQuery_NegativeValue_Fallback(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/?page=-1", nil)
	if v := handler.IntQuery(r, "page", 1); v != 1 {
		t.Errorf("IntQuery with negative value = %d, want fallback 1", v)
	}
}

func TestIntQuery_LargeValue(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/?per_page=1000", nil)
	if v := handler.IntQuery(r, "per_page", 20); v != 1000 {
		t.Errorf("IntQuery large value = %d, want 1000", v)
	}
}
