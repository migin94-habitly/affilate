package partner

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/service"
)

type DocumentsHandler struct {
	docSvc *service.DocumentService
}

func NewDocumentsHandler(ds *service.DocumentService) *DocumentsHandler {
	return &DocumentsHandler{docSvc: ds}
}

func (h *DocumentsHandler) List(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	docs, err := h.docSvc.GetByPartner(r.Context(), partnerID)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, docs)
}

func (h *DocumentsHandler) Initiate(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	var input struct {
		LegalStatus domain.LegalStatus `json:"legal_status"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	docs, err := h.docSvc.InitiateDocuments(r.Context(), partnerID, input.LegalStatus)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, docs)
}

func (h *DocumentsHandler) UploadSigned(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	docIDStr := chi.URLParam(r, "id")
	docID, err := uuid.Parse(docIDStr)
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	var input struct {
		FileURL string `json:"file_url"`
	}
	if err := handler.ParseJSON(r, &input); err != nil || input.FileURL == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "file_url required"})
		return
	}

	if err := h.docSvc.UploadPartnerSigned(r.Context(), partnerID, docID, input.FileURL); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]bool{"uploaded": true})
}

func (h *DocumentsHandler) GetDownload(w http.ResponseWriter, r *http.Request) {
	partnerID := middleware.GetPartnerID(r.Context())
	docIDStr := chi.URLParam(r, "id")
	docID, err := uuid.Parse(docIDStr)
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	fileType := r.URL.Query().Get("type")
	if fileType == "" {
		fileType = "final"
	}

	url, err := h.docSvc.GetDownloadURL(r.Context(), partnerID, docID, fileType)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]string{"url": url})
}
