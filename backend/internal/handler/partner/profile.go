package partner

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/handler"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
)

type ProfileHandler struct {
	partnerRepo *repository.PartnerRepo
}

func NewProfileHandler(pr *repository.PartnerRepo) *ProfileHandler {
	return &ProfileHandler{partnerRepo: pr}
}

func (h *ProfileHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := middleware.GetPartnerID(r.Context())
	partner, err := h.partnerRepo.GetByID(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}
	kyc, _ := h.partnerRepo.GetKYC(r.Context(), id)
	hasOffer, _ := h.partnerRepo.HasAcceptedOffer(r.Context(), id)
	balance, _ := h.partnerRepo.GetBalance(r.Context(), id)

	handler.JSON(w, http.StatusOK, map[string]interface{}{
		"partner":       partner,
		"kyc":           kyc,
		"offer_accepted": hasOffer,
		"balance":       balance,
	})
}

func (h *ProfileHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := middleware.GetPartnerID(r.Context())
	partner, err := h.partnerRepo.GetByID(r.Context(), id)
	if err != nil {
		handler.Error(w, err)
		return
	}

	var input struct {
		Phone    string `json:"phone"`
		FullName string `json:"full_name"`
		Language string `json:"language"`
		Country  string `json:"country"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}

	if input.FullName != "" {
		partner.FullName = input.FullName
	}
	if input.Phone != "" {
		partner.Phone = input.Phone
	}
	if input.Language != "" {
		partner.Language = input.Language
	}
	if input.Country != "" {
		partner.Country = input.Country
	}

	if err := h.partnerRepo.Update(r.Context(), partner); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, partner)
}

func (h *ProfileHandler) SubmitKYC(w http.ResponseWriter, r *http.Request) {
	id := middleware.GetPartnerID(r.Context())
	var input struct {
		IIN               string `json:"iin"`
		BankName          string `json:"bank_name"`
		BankAccount       string `json:"bank_account"`
		BankBIC           string `json:"bank_bic"`
		AccountHolder     string `json:"account_holder"`
		FreedomPayAccount string `json:"freedom_pay_account"`
	}
	if err := handler.ParseJSON(r, &input); err != nil {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	if input.BankAccount == "" && input.FreedomPayAccount == "" {
		handler.JSON(w, http.StatusBadRequest, map[string]string{"error": "bank_account is required"})
		return
	}

	kyc := &domain.PartnerKYC{
		ID:                uuid.New(),
		PartnerID:         id,
		IIN:               input.IIN,
		BankName:          input.BankName,
		BankAccount:       input.BankAccount,
		BankBIC:           input.BankBIC,
		AccountHolder:     input.AccountHolder,
		FreedomPayAccount: input.FreedomPayAccount,
		Status:            "pending",
	}
	if err := h.partnerRepo.UpsertKYC(r.Context(), kyc); err != nil {
		handler.Error(w, err)
		return
	}
	handler.JSON(w, http.StatusOK, kyc)
}

func (h *ProfileHandler) AcceptOffer(w http.ResponseWriter, r *http.Request) {
	id := middleware.GetPartnerID(r.Context())
	var input struct {
		Language string `json:"language"`
	}
	handler.ParseJSON(r, &input)
	if input.Language == "" {
		input.Language = "ru"
	}

	oa := &domain.OfferAcceptance{
		ID:        uuid.New(),
		PartnerID: id,
		Language:  input.Language,
		IPAddress: r.RemoteAddr,
	}
	if err := h.partnerRepo.UpsertOfferAcceptance(r.Context(), oa); err != nil {
		handler.Error(w, err)
		return
	}

	// Activate partner after offer acceptance
	h.partnerRepo.UpdateStatus(r.Context(), id, domain.StatusActive)

	handler.JSON(w, http.StatusOK, map[string]bool{"accepted": true})
}
