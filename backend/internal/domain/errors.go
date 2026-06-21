package domain

import "errors"

var (
	ErrNotFound          = errors.New("not found")
	ErrAlreadyExists     = errors.New("already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrForbidden         = errors.New("forbidden")
	ErrInvalidInput      = errors.New("invalid input")
	ErrInsufficientBalance = errors.New("insufficient balance")
	ErrBelowMinThreshold = errors.New("below minimum payout threshold")
	ErrPartnerSuspended  = errors.New("partner account is suspended")
	ErrKYCNotVerified    = errors.New("KYC not completed")
	ErrOfferNotAccepted  = errors.New("offer not accepted")
)
