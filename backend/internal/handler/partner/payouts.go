package partner

import (
	"net/http"

	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/service"
)

type PayoutsHandler struct {
	payoutSvc *service.PayoutService
}

func NewPayoutsHandler(ps *service.PayoutService) *PayoutsHandler {
	return &PayoutsHandler{payoutSvc: ps}
}

func (h *PayoutsHandler) List(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	page := handler.IntQuery(r, "page", 1)
	perPage := handler.IntQuery(r, "per_page", 20)

	payouts, total, err := h.payoutSvc.GetPartnerPayouts(r.Context(), partnerID, page, perPage)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items":   payouts,
		"total":   total,
		"page":    page,
		"per_page": perPage,
	})
}

func (h *PayoutsHandler) Request(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	var input struct {
		Amount float64 `json:"amount"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	payout, err := h.payoutSvc.RequestPayout(r.Context(), service.RequestPayoutInput{
		PartnerID: partnerID,
		Amount:    input.Amount,
	})
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, payout)
}

func (h *PayoutsHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	balance, err := h.payoutSvc.GetPartnerBalance(r.Context(), partnerID)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, balance)
}
