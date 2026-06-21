package admin

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
	"github.com/ticketon/tap/internal/service"
)

type AdminDocumentsHandler struct {
	docSvc    *service.DocumentService
	adminRepo *repository.AdminRepo
	notifRepo *repository.NotificationRepo
}

func NewAdminDocumentsHandler(ds *service.DocumentService, ar *repository.AdminRepo, nr *repository.NotificationRepo) *AdminDocumentsHandler {
	return &AdminDocumentsHandler{docSvc: ds, adminRepo: ar, notifRepo: nr}
}

func (h *AdminDocumentsHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := repository.DocumentFilter{
		Status:  r.URL.Query().Get("status"),
		Page:    handler.IntQuery(r, "page", 1),
		PerPage: handler.IntQuery(r, "per_page", 20),
	}

	items, total, err := h.docSvc.ListAll(r.Context(), filter)
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

func (h *AdminDocumentsHandler) Sign(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var input struct {
		TicketonFileURL string `json:"ticketon_file_url"`
		FinalFileURL    string `json:"final_file_url"`
	}
	if err := handler.ParseJSON(r, &input); err != nil || input.TicketonFileURL == "" || input.FinalFileURL == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "ticketon_file_url and final_file_url required"})
		return
	}

	// Fetch before signing to get partner_id for notification
	doc, _ := h.docSvc.GetByID(r.Context(), id)

	if err := h.docSvc.AdminSign(r.Context(), id, input.TicketonFileURL, input.FinalFileURL); err != nil {
		handler.Error(w, err)
		return
	}

	adminID := middleware.GetAdminID(r.Context())
	h.adminRepo.LogAudit(r.Context(), "admin", adminID, "sign_document", "legal_document", &id)

	if doc != nil {
		go func() {
			_ = h.notifRepo.Create(context.Background(), &domain.Notification{
				PartnerID: doc.PartnerID,
				Type:      "document_signed",
				Title:     "Документ подписан со стороны Ticketon",
				Body:      "Ваш партнёрский договор подписан Ticketon. Финальный документ доступен для скачивания в разделе «Документы».",
			})
		}()
	}

	handler.JSON(w, http.StatusOK, map[string]bool{"signed": true})
}

func (h *AdminDocumentsHandler) Reject(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var input struct {
		Reason string `json:"reason"`
	}
	if err := handler.ParseJSON(r, &input); err != nil || input.Reason == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "reason required"})
		return
	}

	// Fetch before rejecting to get partner_id for notification
	doc, _ := h.docSvc.GetByID(r.Context(), id)

	if err := h.docSvc.AdminReject(r.Context(), id, input.Reason); err != nil {
		handler.Error(w, err)
		return
	}

	if doc != nil {
		go func() {
			_ = h.notifRepo.Create(context.Background(), &domain.Notification{
				PartnerID: doc.PartnerID,
				Type:      "document_rejected",
				Title:     "Документ отклонён",
				Body:      "Ваш документ был отклонён. Проверьте раздел «Документы» для получения причины и повторной загрузки.",
			})
		}()
	}

	handler.JSON(w, http.StatusOK, map[string]bool{"rejected": true})
}

func (h *AdminDocumentsHandler) GetDownloadURL(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	url, err := h.docSvc.GetAdminDownloadURL(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]string{"url": url})
}

func (h *AdminDocumentsHandler) GetDoc(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	doc, err := h.docSvc.GetByID(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, doc)
}
