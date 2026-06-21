package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/ticketon/tap/internal/domain"
)

func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func Error(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		JSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
	case errors.Is(err, domain.ErrAlreadyExists):
		JSON(w, http.StatusConflict, map[string]string{"error": "already exists"})
	case errors.Is(err, domain.ErrInvalidCredentials):
		JSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
	case errors.Is(err, domain.ErrUnauthorized):
		JSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	case errors.Is(err, domain.ErrForbidden):
		JSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
	case errors.Is(err, domain.ErrInvalidInput):
		JSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
	case errors.Is(err, domain.ErrBelowMinThreshold):
		JSON(w, http.StatusBadRequest, map[string]string{"error": "balance below minimum payout threshold"})
	case errors.Is(err, domain.ErrInsufficientBalance):
		JSON(w, http.StatusBadRequest, map[string]string{"error": "insufficient balance"})
	case errors.Is(err, domain.ErrKYCNotVerified):
		JSON(w, http.StatusForbidden, map[string]string{"error": "KYC not completed"})
	case errors.Is(err, domain.ErrPartnerSuspended):
		JSON(w, http.StatusForbidden, map[string]string{"error": "account suspended"})
	default:
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
	}
}

func ParseJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

func IntQuery(r *http.Request, key string, fallback int) int {
	v := r.URL.Query().Get(key)
	if v == "" {
		return fallback
	}
	var n int
	if _, err := fmt.Sscan(v, &n); err != nil || n < 1 {
		return fallback
	}
	return n
}
