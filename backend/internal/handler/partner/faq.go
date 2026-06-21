package partner

import (
	"net/http"

	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/repository"
)

type FAQHandler struct {
	faqRepo *repository.FAQRepo
}

func NewFAQHandler(fr *repository.FAQRepo) *FAQHandler {
	return &FAQHandler{faqRepo: fr}
}

func (h *FAQHandler) GetFAQ(w http.ResponseWriter, r *http.Request) {
	items, err := h.faqRepo.ListActiveFAQ(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}
	if items == nil {
		items = []*domain.FAQItem{}
	}
	handler.JSON(w, http.StatusOK, items)
}

func (h *FAQHandler) GetContacts(w http.ResponseWriter, r *http.Request) {
	contacts, err := h.faqRepo.ListActiveContacts(r.Context())
	if err != nil {
		handler.Error(w, err)
		return
	}
	if contacts == nil {
		contacts = []*domain.ContactInfo{}
	}
	handler.JSON(w, http.StatusOK, contacts)
}
