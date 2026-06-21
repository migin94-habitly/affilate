package admin

import (
	"net/http"

	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/repository"
)

type AnalyticsHandler struct {
	adminRepo *repository.AdminRepo
}

func NewAnalyticsHandler(ar *repository.AdminRepo) *AnalyticsHandler {
	return &AnalyticsHandler{adminRepo: ar}
}

func (h *AnalyticsHandler) GetChannelROI(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "30d"
	}

	analytics, err := h.adminRepo.GetAnalytics(r.Context(), period)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, analytics)
}
