package admin

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
)

type AdminRequestsHandler struct {
	requestRepo *repository.RequestRepo
	notifRepo   *repository.NotificationRepo
}

func NewAdminRequestsHandler(rr *repository.RequestRepo, nr *repository.NotificationRepo) *AdminRequestsHandler {
	return &AdminRequestsHandler{requestRepo: rr, notifRepo: nr}
}

func (h *AdminRequestsHandler) Stats(w http.ResponseWriter, r *http.Request) {
	counts, err := h.requestRepo.CountByStatus(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, counts)
}

func (h *AdminRequestsHandler) List(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	items, total, err := h.requestRepo.ListAll(r.Context(), status, page, 50)
	if err != nil {
		handler.Error(w, err)
		return
	}
	if items == nil {
		items = []*domain.PartnerRequest{}
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items": items, "total": total, "page": page, "per_page": 50,
	})
}

func (h *AdminRequestsHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	var input struct {
		Status string `json:"status"`
	}
	if err := handler.ParseJSON(r, &input); err != nil || input.Status == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "status is required"})
		return
	}

	req, err := h.requestRepo.GetByID(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}

	if err := h.requestRepo.UpdateStatus(r.Context(), id, input.Status); err != nil {
		handler.Error(w, err)
		return
	}

	// Notify the partner about status change
	notifBody := statusNotifBody(req.Subject, input.Status)
	if notifBody != "" {
		_ = h.notifRepo.Create(r.Context(), &domain.Notification{
			ID:        uuid.New(),
			PartnerID: req.PartnerID,
			Type:      "request_status",
			Title:     "Статус вашего запроса обновлён",
			Body:      notifBody,
		})
	}

	handler.JSON(w, http.StatusOK, map[string]string{"status": input.Status})
}

func (h *AdminRequestsHandler) AddNote(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	adminID := middleware.GetAdminID(r.Context())
	var input struct {
		Body string `json:"body"`
	}
	if err := handler.ParseJSON(r, &input); err != nil || input.Body == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "body is required"})
		return
	}

	note := &domain.RequestNote{
		ID:        uuid.New(),
		RequestID: id,
		AdminID:   adminID,
		Body:      input.Body,
	}
	if err := h.requestRepo.AddNote(r.Context(), note); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, note)
}

func (h *AdminRequestsHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	req, err := h.requestRepo.GetByID(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, req)
}

func statusNotifBody(subject, status string) string {
	switch status {
	case "in_progress":
		return "Ваш запрос «" + subject + "» взят в работу."
	case "resolved":
		return "Ваш запрос «" + subject + "» решён. Проверьте детали в кабинете."
	case "closed":
		return "Ваш запрос «" + subject + "» закрыт."
	}
	return ""
}
