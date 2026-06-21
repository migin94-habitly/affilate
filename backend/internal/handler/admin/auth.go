package admin

import (
	"net/http"

	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
	"github.com/ticketon/tap/internal/service"
)

type AuthHandler struct {
	authSvc   *service.AuthService
	adminRepo *repository.AdminRepo
}

func NewAuthHandler(authSvc *service.AuthService, adminRepo *repository.AdminRepo) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, adminRepo: adminRepo}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	result, err := h.authSvc.LoginAdmin(r.Context(), input.Email, input.Password)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, result)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	id := middleware.GetAdminID(r.Context())
	admin, err := h.adminRepo.GetByID(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, admin)
}
