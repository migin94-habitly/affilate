package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
)

type PartnersHandler struct {
	partnerRepo *repository.PartnerRepo
	adminRepo   *repository.AdminRepo
}

func NewPartnersHandler(pr *repository.PartnerRepo, ar *repository.AdminRepo) *PartnersHandler {
	return &PartnersHandler{partnerRepo: pr, adminRepo: ar}
}

func (h *PartnersHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := repository.PartnerFilter{
		Status:  q.Get("status"),
		Segment: q.Get("segment"),
		Search:  q.Get("search"),
		Page:    handler.IntQuery(r, "page", 1),
		PerPage: handler.IntQuery(r, "per_page", 20),
	}

	partners, total, err := h.partnerRepo.List(r.Context(), filter)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items":   partners,
		"total":   total,
		"page":    filter.Page,
		"per_page": filter.PerPage,
	})
}

func (h *PartnersHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	partner, err := h.partnerRepo.GetByID(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}
	kyc, _ := h.partnerRepo.GetKYC(r.Context(), id)
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"partner": partner,
		"kyc":     kyc,
	})
}

func (h *PartnersHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var input struct {
		Status domain.PartnerStatus `json:"status"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	if err := h.partnerRepo.UpdateStatus(r.Context(), id, input.Status); err != nil {
		handler.Error(w, err)
		return
	}

	adminID := middleware.GetAdminID(r.Context())
	h.adminRepo.LogAudit(r.Context(), "admin", adminID, "update_partner_status", "partner", &id)

	handler.JSON(w, http.StatusOK, map[string]string{"status": string(input.Status)})
}

func (h *PartnersHandler) UpdateTier(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var input struct {
		Tier domain.PartnerTier `json:"tier"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	if err := h.partnerRepo.UpdateTier(r.Context(), id, input.Tier); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]string{"tier": string(input.Tier)})
}
