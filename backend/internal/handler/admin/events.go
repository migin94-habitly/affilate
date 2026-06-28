package admin

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
	"github.com/ticketon/tap/internal/service"
)

type AdminEventsHandler struct {
	eventRepo *repository.EventRepo
	adminRepo *repository.AdminRepo
}

func NewAdminEventsHandler(er *repository.EventRepo, ar *repository.AdminRepo) *AdminEventsHandler {
	return &AdminEventsHandler{eventRepo: er, adminRepo: ar}
}

func (h *AdminEventsHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(q.Get("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	events, total, err := h.eventRepo.ListAll(r.Context(), repository.EventFilter{
		City:     q.Get("city"),
		Category: q.Get("category"),
		Search:   q.Get("search"),
		Page:     page,
		PerPage:  perPage,
	})
	if err != nil {
		handler.Error(w, err)
		return
	}

	if events == nil {
		events = []*domain.Event{}
	}

	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}

	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items":       events,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": totalPages,
	})
}

func (h *AdminEventsHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ExternalID    string   `json:"external_id"`
		Title         string   `json:"title"`
		City          string   `json:"city"`
		Category      string   `json:"category"`
		Venue         string   `json:"venue"`
		ImageURL      string   `json:"image_url"`
		BaseURL       string   `json:"base_url"`
		MinPrice      float64  `json:"min_price"`
		Currency      string   `json:"currency"`
		ServiceFeePct float64  `json:"service_fee_pct"`
		IsActive      bool     `json:"is_active"`
		SpecialRate   *float64 `json:"special_rate,omitempty"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.ExternalID == "" || input.Title == "" || input.BaseURL == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "external_id, title and base_url are required"})
		return
	}

	event := &domain.Event{
		ID:            uuid.New(),
		ExternalID:    input.ExternalID,
		Title:         input.Title,
		City:          input.City,
		Category:      input.Category,
		Venue:         input.Venue,
		ImageURL:      input.ImageURL,
		BaseURL:       input.BaseURL,
		MinPrice:      input.MinPrice,
		Currency:      input.Currency,
		ServiceFeePct: input.ServiceFeePct,
		IsActive:      input.IsActive,
		SpecialRate:   input.SpecialRate,
	}

	if err := h.eventRepo.Upsert(r.Context(), event); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, event)
}

// SetSpecialRate sets a per-event commission rate (% of GMV) overriding the tier base rate.
// Guardrails enforced (PRD §5.5):
//  1. Rate cannot push Ticketon margin negative (special_rate < event.service_fee_pct).
//  2. Change is written to audit log.
//
// Required role: moderator or higher (less restricted than mass tier change, per PRD §5.5 guardrail #4).
func (h *AdminEventsHandler) SetSpecialRate(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var input struct {
		SpecialRate *float64 `json:"special_rate"` // nil clears the override
		Reason      string   `json:"reason"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	// Guardrail #1: if setting a non-nil rate, ensure margin stays positive.
	if input.SpecialRate != nil {
		event, err := h.eventRepo.GetByIDAdmin(r.Context(), id)
		if err != nil {
			handler.Error(w, err)
			return
		}
		sfPct := event.ServiceFeePct
		if sfPct <= 0 {
			sfPct = service.DefaultSFPct
		}
		if *input.SpecialRate >= sfPct {
			handler.JSON(w, http.StatusUnprocessableEntity, map[string]string{
				"error": fmt.Sprintf("special_rate %.2f%% would exceed event service_fee_pct %.2f%%, Ticketon margin would go negative", *input.SpecialRate, sfPct),
			})
			return
		}
	}

	if err := h.eventRepo.UpdateSpecialRate(r.Context(), id, input.SpecialRate); err != nil {
		handler.Error(w, err)
		return
	}

	// Audit log (PRD §5.5 guardrail #2).
	adminID := middleware.GetAdminID(r.Context())
	_ = h.adminRepo.LogAudit(context.Background(), "admin", adminID, "event_special_rate_set", "event", &id)

	handler.JSON(w, http.StatusOK, map[string]bool{"updated": true})
}

func (h *AdminEventsHandler) GetFilters(w http.ResponseWriter, r *http.Request) {
	cities, _ := h.eventRepo.GetAllCities(r.Context())
	cats, _ := h.eventRepo.GetAllCategories(r.Context())
	if cities == nil {
		cities = []string{}
	}
	if cats == nil {
		cats = []string{}
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"cities":     cities,
		"categories": cats,
	})
}

func (h *AdminEventsHandler) SetActive(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var input struct {
		IsActive bool `json:"is_active"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	if err := h.eventRepo.SetActive(r.Context(), id, input.IsActive); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]bool{"updated": true})
}
