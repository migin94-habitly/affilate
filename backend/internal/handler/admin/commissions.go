package admin

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/repository"
	"github.com/ticketon/tap/internal/service"
)

type CommissionsHandler struct {
	commSvc *service.CommissionService
	commRepo *repository.CommissionRepo
}

func NewCommissionsHandler(cs *service.CommissionService, cr *repository.CommissionRepo) *CommissionsHandler {
	return &CommissionsHandler{commSvc: cs, commRepo: cr}
}

func (h *CommissionsHandler) GetTariffs(w http.ResponseWriter, r *http.Request) {
	tariffs, err := h.commSvc.GetTariffs(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, tariffs)
}

func (h *CommissionsHandler) UpdateTariff(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Tier               domain.PartnerTier `json:"tier"`
		BaseRate           float64            `json:"base_rate"`
		MinOrdersForSilver int                `json:"min_orders_for_silver"`
		CPABonus           float64            `json:"cpa_bonus"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	tariff := &domain.Tariff{
		Tier:               input.Tier,
		BaseRate:           input.BaseRate,
		MinOrdersForSilver: input.MinOrdersForSilver,
		CPABonus:           input.CPABonus,
	}

	if err := h.commSvc.UpdateTariff(r.Context(), tariff); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, tariff)
}

func (h *CommissionsHandler) List(w http.ResponseWriter, r *http.Request) {
	partnerIDStr := r.URL.Query().Get("partner_id")
	filter := repository.CommissionFilter{
		Status:  r.URL.Query().Get("status"),
		Page:    handler.IntQuery(r, "page", 1),
		PerPage: handler.IntQuery(r, "per_page", 20),
	}
	if partnerIDStr != "" {
		if id, err := uuid.Parse(partnerIDStr); err == nil {
			filter.PartnerID = id
		}
	}

	items, total, err := h.commRepo.ListAll(r.Context(), filter)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items":   items,
		"total":   total,
		"page":    filter.Page,
		"per_page": filter.PerPage,
	})
}

func (h *CommissionsHandler) ApproveAll(w http.ResponseWriter, r *http.Request) {
	count, err := h.commSvc.ApproveAll(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]int64{"approved": count})
}
