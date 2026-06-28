package partner

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
)

type RequestsHandler struct {
	requestRepo *repository.RequestRepo
}

func NewRequestsHandler(rr *repository.RequestRepo) *RequestsHandler {
	return &RequestsHandler{requestRepo: rr}
}

func (h *RequestsHandler) List(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	items, total, err := h.requestRepo.ListByPartner(r.Context(), partnerID, page, 20)
	if err != nil {
		handler.Error(w, err)
		return
	}
	if items == nil {
		items = []*domain.PartnerRequest{}
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items": items, "total": total, "page": page, "per_page": 20,
	})
}

func (h *RequestsHandler) Create(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	var input struct {
		Type    string `json:"type"`
		Subject string `json:"subject"`
		Body    string `json:"body"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.Subject == "" || input.Body == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "subject and body are required"})
		return
	}
	if input.Type == "" {
		input.Type = "general"
	}

	req := &domain.PartnerRequest{
		ID:        uuid.New(),
		PartnerID: partnerID,
		Type:      input.Type,
		Subject:   input.Subject,
		Body:      input.Body,
		Status:    "new",
	}
	if err := h.requestRepo.Create(r.Context(), req); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, req)
}
