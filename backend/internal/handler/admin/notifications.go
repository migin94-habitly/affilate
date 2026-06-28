package admin

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/repository"
)

type AdminNotificationsHandler struct {
	notifRepo *repository.NotificationRepo
}

func NewAdminNotificationsHandler(nr *repository.NotificationRepo) *AdminNotificationsHandler {
	return &AdminNotificationsHandler{notifRepo: nr}
}

// List returns all partner notifications for admin, optionally filtered by partner_id.
func (h *AdminNotificationsHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	var partnerID *uuid.UUID
	if pidStr := r.URL.Query().Get("partner_id"); pidStr != "" {
		if pid, err := uuid.Parse(pidStr); err == nil {
			partnerID = &pid
		}
	}

	items, total, err := h.notifRepo.ListAll(r.Context(), partnerID, page, perPage)
	if err != nil {
		handler.Error(w, err)
		return
	}
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items": items, "total": total, "page": page, "per_page": perPage, "total_pages": totalPages,
	})
}

// Send creates a notification for one partner (by partner_id) or broadcasts to all active partners.
func (h *AdminNotificationsHandler) Send(w http.ResponseWriter, r *http.Request) {
	var input struct {
		PartnerID *string `json:"partner_id"` // nil = broadcast
		Type      string  `json:"type"`
		Title     string  `json:"title"`
		Body      string  `json:"body"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.Title == "" || input.Body == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "title and body are required"})
		return
	}
	typ := input.Type
	if typ == "" {
		typ = "admin_message"
	}

	if input.PartnerID != nil && *input.PartnerID != "" {
		pid, err := uuid.Parse(*input.PartnerID)
		if err != nil {
			handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid partner_id"})
			return
		}
		n := &domain.Notification{PartnerID: pid, Type: typ, Title: input.Title, Body: input.Body}
		if err := h.notifRepo.Create(r.Context(), n); err != nil {
			handler.Error(w, err)
			return
		}
		handler.JSON(w, http.StatusOK, map[string]interface{}{"sent": 1})
		return
	}

	count, err := h.notifRepo.CreateBroadcast(r.Context(), typ, input.Title, input.Body)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{"sent": count})
}
