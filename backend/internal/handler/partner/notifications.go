package partner

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
)

type NotificationsHandler struct {
	notifRepo *repository.NotificationRepo
}

func NewNotificationsHandler(nr *repository.NotificationRepo) *NotificationsHandler {
	return &NotificationsHandler{notifRepo: nr}
}

func (h *NotificationsHandler) List(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	page := handler.IntQuery(r, "page", 1)
	perPage := handler.IntQuery(r, "per_page", 20)

	items, total, err := h.notifRepo.ListByPartner(r.Context(), partnerID, page, perPage)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items":    items,
		"total":    total,
		"page":     page,
		"per_page": perPage,
	})
}

func (h *NotificationsHandler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	count, err := h.notifRepo.UnreadCount(r.Context(), partnerID)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]int64{"unread": count})
}

func (h *NotificationsHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	if err := h.notifRepo.MarkRead(r.Context(), id, partnerID); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *NotificationsHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	if err := h.notifRepo.MarkAllRead(r.Context(), partnerID); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]bool{"ok": true})
}
