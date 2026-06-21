package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/repository"
)

type AdminFAQHandler struct {
	faqRepo *repository.FAQRepo
}

func NewAdminFAQHandler(fr *repository.FAQRepo) *AdminFAQHandler {
	return &AdminFAQHandler{faqRepo: fr}
}

// --- FAQ ---

func (h *AdminFAQHandler) ListFAQ(w http.ResponseWriter, r *http.Request) {
	items, err := h.faqRepo.ListAllFAQ(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}
	if items == nil {
		items = []*domain.FAQItem{}
	}
	handler.JSON(w, http.StatusOK, items)
}

func (h *AdminFAQHandler) CreateFAQ(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Question  string `json:"question"`
		Answer    string `json:"answer"`
		Category  string `json:"category"`
		SortOrder int    `json:"sort_order"`
		IsActive  bool   `json:"is_active"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.Question == "" || input.Answer == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "question and answer are required"})
		return
	}
	if input.Category == "" {
		input.Category = "general"
	}

	item := &domain.FAQItem{
		Question:  input.Question,
		Answer:    input.Answer,
		Category:  input.Category,
		SortOrder: input.SortOrder,
		IsActive:  input.IsActive,
	}
	if err := h.faqRepo.CreateFAQ(r.Context(), item); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, item)
}

func (h *AdminFAQHandler) UpdateFAQ(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	existing, err := h.faqRepo.GetFAQ(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}

	var input struct {
		Question  string `json:"question"`
		Answer    string `json:"answer"`
		Category  string `json:"category"`
		SortOrder int    `json:"sort_order"`
		IsActive  bool   `json:"is_active"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.Question != "" {
		existing.Question = input.Question
	}
	if input.Answer != "" {
		existing.Answer = input.Answer
	}
	if input.Category != "" {
		existing.Category = input.Category
	}
	existing.SortOrder = input.SortOrder
	existing.IsActive = input.IsActive

	if err := h.faqRepo.UpdateFAQ(r.Context(), existing); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, existing)
}

func (h *AdminFAQHandler) DeleteFAQ(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	if err := h.faqRepo.DeleteFAQ(r.Context(), id); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

// --- Contacts ---

func (h *AdminFAQHandler) ListContacts(w http.ResponseWriter, r *http.Request) {
	items, err := h.faqRepo.ListAllContacts(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}
	if items == nil {
		items = []*domain.ContactInfo{}
	}
	handler.JSON(w, http.StatusOK, items)
}

func (h *AdminFAQHandler) CreateContact(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Type      string `json:"type"`
		Label     string `json:"label"`
		Value     string `json:"value"`
		SortOrder int    `json:"sort_order"`
		IsActive  bool   `json:"is_active"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.Type == "" || input.Label == "" || input.Value == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "type, label and value are required"})
		return
	}

	c := &domain.ContactInfo{
		Type:      input.Type,
		Label:     input.Label,
		Value:     input.Value,
		SortOrder: input.SortOrder,
		IsActive:  input.IsActive,
	}
	if err := h.faqRepo.CreateContact(r.Context(), c); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, c)
}

func (h *AdminFAQHandler) UpdateContact(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	existing, err := h.faqRepo.GetContact(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}

	var input struct {
		Type      string `json:"type"`
		Label     string `json:"label"`
		Value     string `json:"value"`
		SortOrder int    `json:"sort_order"`
		IsActive  bool   `json:"is_active"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.Type != "" {
		existing.Type = input.Type
	}
	if input.Label != "" {
		existing.Label = input.Label
	}
	if input.Value != "" {
		existing.Value = input.Value
	}
	existing.SortOrder = input.SortOrder
	existing.IsActive = input.IsActive

	if err := h.faqRepo.UpdateContact(r.Context(), existing); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, existing)
}

func (h *AdminFAQHandler) DeleteContact(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	if err := h.faqRepo.DeleteContact(r.Context(), id); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
}
