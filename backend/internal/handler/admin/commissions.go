package admin

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
	"github.com/ticketon/tap/internal/service"
)

type CommissionsHandler struct {
	commSvc   *service.CommissionService
	commRepo  *repository.CommissionRepo
	adminRepo *repository.AdminRepo
}

func NewCommissionsHandler(cs *service.CommissionService, cr *repository.CommissionRepo, ar *repository.AdminRepo) *CommissionsHandler {
	return &CommissionsHandler{commSvc: cs, commRepo: cr, adminRepo: ar}
}

func (h *CommissionsHandler) GetTariffs(w http.ResponseWriter, r *http.Request) {
	tariffs, err := h.commSvc.GetTariffs(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, tariffs)
}

// UpdateTariff accepts gmv_rate (% of GMV) as the primary input per PRD §5.2/5.3.
// Guardrails enforced (PRD §5.5):
//  1. Blocks rate where net Ticketon margin goes negative.
//  2. Writes audit log with actor ID.
//  3. Decreases are scheduled (14-day notice); increases apply immediately.
//
// Required admin role: finance or super_admin (PRD §5.5 guardrail #4).
func (h *CommissionsHandler) UpdateTariff(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Tier               domain.PartnerTier `json:"tier"`
		GmvRate            float64            `json:"gmv_rate"`
		ServiceFeePct      float64            `json:"service_fee_pct"` // optional; defaults to service.DefaultSFPct
		MinOrdersForSilver int                `json:"min_orders_for_silver"`
		CPABonus           float64            `json:"cpa_bonus"`
		Reason             string             `json:"reason"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.Tier == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "tier is required"})
		return
	}

	result, err := h.commSvc.UpdateTariff(
		r.Context(),
		input.GmvRate,
		input.ServiceFeePct,
		input.MinOrdersForSilver,
		input.CPABonus,
		input.Tier,
		input.Reason,
	)
	if err != nil {
		handler.JSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		return
	}

	// Audit log: who/when/what changed (PRD §5.5 guardrail #2, AR-12).
	adminID := middleware.GetAdminID(r.Context())
	action := "tariff_rate_increase"
	if result.Delayed {
		action = "tariff_rate_decrease_scheduled"
	}
	_ = h.adminRepo.LogAudit(context.Background(), "admin", adminID, action, "tariff", nil)

	resp := map[string]interface{}{
		"tariff":  result.Tariff,
		"delayed": result.Delayed,
	}
	if result.Message != "" {
		resp["notice"] = result.Message
	}
	handler.JSON(w, http.StatusOK, resp)
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
		"items":    items,
		"total":    total,
		"page":     filter.Page,
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
