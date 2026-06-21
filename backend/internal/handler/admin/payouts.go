package admin

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/repository"
	"github.com/ticketon/tap/internal/service"
)

type AdminPayoutsHandler struct {
	payoutSvc *service.PayoutService
}

func NewAdminPayoutsHandler(ps *service.PayoutService) *AdminPayoutsHandler {
	return &AdminPayoutsHandler{payoutSvc: ps}
}

func (h *AdminPayoutsHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := repository.PayoutFilter{
		Status:  r.URL.Query().Get("status"),
		Page:    handler.IntQuery(r, "page", 1),
		PerPage: handler.IntQuery(r, "per_page", 20),
	}

	items, total, err := h.payoutSvc.ListAll(r.Context(), filter)
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

func (h *AdminPayoutsHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var input struct {
		Status        domain.PayoutStatus `json:"status"`
		FreedomPayRef *string             `json:"freedom_pay_ref"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	if err := h.payoutSvc.UpdateStatus(r.Context(), id, input.Status, input.FreedomPayRef); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]string{"status": string(input.Status)})
}

// ExportCSV generates a Freedom Pay compatible CSV export of pending payouts
func (h *AdminPayoutsHandler) ExportCSV(w http.ResponseWriter, r *http.Request) {
	rows, err := h.payoutSvc.ExportPending(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}

	filename := fmt.Sprintf("freedom_pay_payouts_%s.csv", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename="+filename)

	writer := csv.NewWriter(w)
	writer.Write([]string{"payout_id", "partner_id", "partner_name", "email", "freedom_pay_account", "amount", "currency", "requested_at"})
	for _, row := range rows {
		writer.Write([]string{
			row.PayoutID.String(),
			row.PartnerID.String(),
			row.PartnerName,
			row.Email,
			row.FreedomPayAccount,
			fmt.Sprintf("%.2f", row.Amount),
			row.Currency,
			fmt.Sprintf("%v", row.RequestedAt),
		})
	}
	writer.Flush()
}
