package partner

import (
	"net/http"

	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/service"
)

type AuthHandler struct {
	authSvc *service.AuthService
}

func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string               `json:"email"`
		Phone    string               `json:"phone"`
		Password string               `json:"password"`
		FullName string               `json:"full_name"`
		Segment  domain.PartnerSegment `json:"segment"`
		Language string               `json:"language"`
		Country  string               `json:"country"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if input.Email == "" || input.Password == "" || input.FullName == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "email, password and full_name are required"})
		return
	}

	result, err := h.authSvc.RegisterPartner(r.Context(), service.RegisterInput{
		Email:    input.Email,
		Phone:    input.Phone,
		Password: input.Password,
		FullName: input.FullName,
		Segment:  input.Segment,
		Language: input.Language,
		Country:  input.Country,
	})
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusCreated, result)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	result, err := h.authSvc.LoginPartner(r.Context(), input.Email, input.Password)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, result)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := handler.ParseJSON(r, &input); err != nil || input.RefreshToken == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "refresh_token required"})
		return
	}

	result, err := h.authSvc.RefreshPartnerToken(r.Context(), input.RefreshToken)
	if err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, result)
}
