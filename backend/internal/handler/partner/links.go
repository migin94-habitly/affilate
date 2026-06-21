package partner

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/service"
)

type LinksHandler struct {
	trackingSvc *service.TrackingService
}

func NewLinksHandler(ts *service.TrackingService) *LinksHandler {
	return &LinksHandler{trackingSvc: ts}
}

func (h *LinksHandler) Generate(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())

	var input struct {
		EventID *string `json:"event_id"`
		Channel string  `json:"channel"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	genInput := service.GenerateLinkInput{
		PartnerID: partnerID,
		Channel:   input.Channel,
	}

	if input.EventID != nil && *input.EventID != "" {
		id, err := uuid.Parse(*input.EventID)
		if err != nil {
			handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid event_id"})
			return
		}
		genInput.EventID = &id
	}

	link, err := h.trackingSvc.GenerateLink(r.Context(), genInput)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, link)
}

func (h *LinksHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "month"
	}

	stats, err := h.trackingSvc.GetStats(r.Context(), partnerID, period)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, stats)
}

func (h *LinksHandler) GetTimeSeries(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	days := handler.IntQuery(r, "days", 30)

	series, err := h.trackingSvc.GetClickTimeSeries(r.Context(), partnerID, days)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, series)
}
