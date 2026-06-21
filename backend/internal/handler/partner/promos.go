package partner

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
)

type PromosHandler struct {
	promoRepo *repository.PromoRepo
}

func NewPromosHandler(pr *repository.PromoRepo) *PromosHandler {
	return &PromosHandler{promoRepo: pr}
}

func (h *PromosHandler) List(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	codes, err := h.promoRepo.GetByPartner(r.Context(), partnerID)
	if err != nil {
		handler.Error(w, err)
		return
	}
	if codes == nil {
		codes = []*domain.PromoCode{}
	}
	handler.JSON(w, http.StatusOK, codes)
}

func (h *PromosHandler) Create(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	var input struct {
		Code    string     `json:"code"`
		EventID *uuid.UUID `json:"event_id,omitempty"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	code := strings.TrimSpace(strings.ToUpper(input.Code))
	if len(code) < 3 || len(code) > 20 {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "code must be 3–20 characters"})
		return
	}

	promo := &domain.PromoCode{
		ID:        uuid.New(),
		Code:      code,
		PartnerID: partnerID,
		EventID:   input.EventID,
		IsActive:  true,
	}

	if err := h.promoRepo.Create(r.Context(), promo); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, promo)
}

func (h *PromosHandler) Deactivate(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	codes, err := h.promoRepo.GetByPartner(r.Context(), partnerID)
	if err != nil {
		handler.Error(w, err)
		return
	}
	owns := false
	for _, c := range codes {
		if c.ID == id {
			owns = true
			break
		}
	}
	if !owns {
		handler.JSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
		return
	}

	if err := h.promoRepo.SetActive(r.Context(), id, false); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]bool{"deactivated": true})
}
