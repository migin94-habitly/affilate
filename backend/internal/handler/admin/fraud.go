package admin

import (
	"net/http"
	"time"

	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/repository"
)

type FraudHandler struct {
	trackingRepo *repository.TrackingRepo
}

func NewFraudHandler(tr *repository.TrackingRepo) *FraudHandler {
	return &FraudHandler{trackingRepo: tr}
}

func (h *FraudHandler) GetSignals(w http.ResponseWriter, r *http.Request) {
	spikes, _ := h.trackingRepo.DetectClickSpike(r.Context())
	zeroConv, _ := h.trackingRepo.DetectZeroConversion(r.Context())

	var signals []domain.FraudSignal
	for _, row := range spikes {
		signals = append(signals, domain.FraudSignal{
			PartnerID:   row.PartnerID,
			PartnerName: row.PartnerName,
			SignalType:  "click_spike",
			Description: "Unusual click volume in last 1 hour",
			Severity:    "high",
			Count:       row.Count,
			DetectedAt:  time.Now(),
		})
	}
	for _, row := range zeroConv {
		signals = append(signals, domain.FraudSignal{
			PartnerID:   row.PartnerID,
			PartnerName: row.PartnerName,
			SignalType:  "zero_conversion",
			Description: "High click volume with zero conversions in last 7 days",
			Severity:    "medium",
			Count:       row.Count,
			DetectedAt:  time.Now(),
		})
	}

	if signals == nil {
		signals = []domain.FraudSignal{}
	}
	handler.JSON(w, http.StatusOK, signals)
}
