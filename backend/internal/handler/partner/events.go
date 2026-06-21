package partner

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/repository"
)

type EventsHandler struct {
	eventRepo *repository.EventRepo
}

func NewEventsHandler(er *repository.EventRepo) *EventsHandler {
	return &EventsHandler{eventRepo: er}
}

func (h *EventsHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := repository.EventFilter{
		City:     q.Get("city"),
		Category: q.Get("category"),
		Search:   q.Get("search"),
		Page:     handler.IntQuery(r, "page", 1),
		PerPage:  handler.IntQuery(r, "per_page", 20),
	}

	events, total, err := h.eventRepo.List(r.Context(), filter)
	if err != nil {
		handler.Error(w, err)
		return
	}

	pages := int(total) / filter.PerPage
	if int(total)%filter.PerPage > 0 {
		pages++
	}

	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"items":       events,
		"total":       total,
		"page":        filter.Page,
		"per_page":    filter.PerPage,
		"total_pages": pages,
	})
}

func (h *EventsHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	event, err := h.eventRepo.GetByID(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, event)
}

func (h *EventsHandler) GetFilters(w http.ResponseWriter, r *http.Request) {
	cities, _ := h.eventRepo.GetCities(r.Context())
	cats, _ := h.eventRepo.GetCategories(r.Context())
	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"cities":     cities,
		"categories": cats,
	})
}
