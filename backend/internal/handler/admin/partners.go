package admin

import (
	"context"
	"fmt"
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
	notifRepo   *repository.NotificationRepo
}

func NewPartnersHandler(pr *repository.PartnerRepo, ar *repository.AdminRepo, nr *repository.NotificationRepo) *PartnersHandler {
	return &PartnersHandler{partnerRepo: pr, adminRepo: ar, notifRepo: nr}
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
	if partners == nil {
		partners = []*domain.Partner{}
	}
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items":    partners,
		"total":    total,
		"page":     filter.Page,
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

	go h.sendStatusNotification(id, input.Status)

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

	go h.sendTierNotification(id, input.Tier)

	handler.JSON(w, http.StatusOK, map[string]string{"tier": string(input.Tier)})
}

func (h *PartnersHandler) sendStatusNotification(partnerID uuid.UUID, status domain.PartnerStatus) {
	ctx := context.Background()
	var notif *domain.Notification
	switch status {
	case domain.StatusActive:
		notif = &domain.Notification{
			PartnerID: partnerID,
			Type:      "partner_approved",
			Title:     "Ваша заявка одобрена",
			Body:      "Поздравляем! Ваш партнёрский аккаунт активирован. Теперь вы можете генерировать ссылки и зарабатывать комиссию.",
		}
	case domain.StatusSuspended:
		notif = &domain.Notification{
			PartnerID: partnerID,
			Type:      "partner_suspended",
			Title:     "Аккаунт приостановлен",
			Body:      "Ваш партнёрский аккаунт временно приостановлен. Пожалуйста, свяжитесь с поддержкой для выяснения причин.",
		}
	case domain.StatusBanned:
		notif = &domain.Notification{
			PartnerID: partnerID,
			Type:      "partner_banned",
			Title:     "Аккаунт заблокирован",
			Body:      "Ваш партнёрский аккаунт заблокирован. Обратитесь в поддержку для получения подробной информации.",
		}
	default:
		return
	}
	_ = h.notifRepo.Create(ctx, notif)
}

func (h *PartnersHandler) sendTierNotification(partnerID uuid.UUID, tier domain.PartnerTier) {
	ctx := context.Background()
	tierNames := map[domain.PartnerTier]string{
		domain.TierBronze: "Бронза (3% GMV)",
		domain.TierSilver: "Серебро (5% GMV)",
		domain.TierGold:   "Золото (7% GMV)",
	}
	name := tierNames[tier]
	notif := &domain.Notification{
		PartnerID: partnerID,
		Type:      "tier_upgraded",
		Title:     "Ваш партнёрский тир изменён",
		Body:      fmt.Sprintf("Поздравляем! Ваш тир обновлён до уровня %s. Новая ставка комиссии уже применена.", name),
	}
	_ = h.notifRepo.Create(ctx, notif)
}
