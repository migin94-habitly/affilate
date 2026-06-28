package tracking

import (
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/service"
)

type TrackHandler struct {
	trackingSvc *service.TrackingService
}

func NewTrackHandler(ts *service.TrackingService) *TrackHandler {
	return &TrackHandler{trackingSvc: ts}
}

// Track handles click tracking and redirects to destination
func (h *TrackHandler) Track(w http.ResponseWriter, r *http.Request) {
	clickID := chi.URLParam(r, "click_id")
	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = r.RemoteAddr
	}

	destURL, cookieExpires, err := h.trackingSvc.RecordClick(r.Context(), clickID, ip, r.UserAgent(), r.Referer())
	if err != nil {
		http.Redirect(w, r, "https://ticketon.kz", http.StatusFound)
		return
	}

	// Set first-party cookie for attribution; expiry mirrors the click's own window.
	http.SetCookie(w, &http.Cookie{
		Name:     "tap_click",
		Value:    clickID,
		Path:     "/",
		Expires:  cookieExpires,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
	})

	http.Redirect(w, r, destURL, http.StatusFound)
}

// Webhook handles order completion events from Ticketon core
func (h *TrackHandler) OrderWebhook(w http.ResponseWriter, r *http.Request) {
	var input service.OrderWebhookInput
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	webhookSecret := os.Getenv("WEBHOOK_SECRET")
	if webhookSecret == "" {
		webhookSecret = "dev-webhook-secret"
	}

	if err := h.trackingSvc.ProcessOrderWebhook(r.Context(), input, webhookSecret); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]bool{"processed": true})
}
