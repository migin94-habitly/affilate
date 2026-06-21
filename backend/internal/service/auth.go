package service

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/config"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	partnerRepo *repository.PartnerRepo
	adminRepo   *repository.AdminRepo
	cfg         *config.JWTConfig
}

func NewAuthService(pr *repository.PartnerRepo, ar *repository.AdminRepo, cfg *config.JWTConfig) *AuthService {
	return &AuthService{partnerRepo: pr, adminRepo: ar, cfg: cfg}
}

type RegisterInput struct {
	Email    string
	Phone    string
	Password string
	FullName string
	Segment  domain.PartnerSegment
	Language string
	Country  string
}

type AuthResult struct {
	Token        string        `json:"token"`
	RefreshToken string        `json:"refresh_token"`
	Partner      *domain.Partner `json:"partner,omitempty"`
	Admin        *domain.AdminUser `json:"admin,omitempty"`
}

func (s *AuthService) RegisterPartner(ctx context.Context, input RegisterInput) (*AuthResult, error) {
	existing, _ := s.partnerRepo.GetByEmail(ctx, input.Email)
	if existing != nil {
		return nil, domain.ErrAlreadyExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	partner := &domain.Partner{
		ID:           uuid.New(),
		Email:        input.Email,
		Phone:        input.Phone,
		PasswordHash: string(hash),
		FullName:     input.FullName,
		Segment:      input.Segment,
		Tier:         domain.TierBronze,
		Status:       domain.StatusPending,
		Language:     input.Language,
		Country:      input.Country,
	}
	if partner.Language == "" {
		partner.Language = "ru"
	}
	if partner.Country == "" {
		partner.Country = "KZ"
	}

	if err := s.partnerRepo.Create(ctx, partner); err != nil {
		return nil, err
	}
	if err := s.partnerRepo.EnsureBalance(ctx, partner.ID); err != nil {
		return nil, err
	}

	return s.issuePartnerTokens(partner)
}

func (s *AuthService) LoginPartner(ctx context.Context, email, password string) (*AuthResult, error) {
	partner, err := s.partnerRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(partner.PasswordHash), []byte(password)); err != nil {
		return nil, domain.ErrInvalidCredentials
	}
	if partner.Status == domain.StatusBanned {
		return nil, domain.ErrPartnerSuspended
	}
	return s.issuePartnerTokens(partner)
}

func (s *AuthService) LoginAdmin(ctx context.Context, email, password string) (*AuthResult, error) {
	admin, err := s.adminRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(password)); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	token, err := s.signToken(admin.ID.String(), "admin", string(admin.Role), s.cfg.ExpiryHours)
	if err != nil {
		return nil, err
	}
	refresh, err := s.signToken(admin.ID.String(), "admin", string(admin.Role), s.cfg.RefreshExpHours)
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, RefreshToken: refresh, Admin: admin}, nil
}

func (s *AuthService) issuePartnerTokens(partner *domain.Partner) (*AuthResult, error) {
	token, err := s.signToken(partner.ID.String(), "partner", "", s.cfg.ExpiryHours)
	if err != nil {
		return nil, err
	}
	refresh, err := s.signToken(partner.ID.String(), "partner", "", s.cfg.RefreshExpHours)
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, RefreshToken: refresh, Partner: partner}, nil
}

func (s *AuthService) signToken(subject, tokenType, role string, expiryHours int) (string, error) {
	claims := jwt.MapClaims{
		"sub":  subject,
		"type": tokenType,
		"role": role,
		"exp":  time.Now().Add(time.Duration(expiryHours) * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.cfg.Secret))
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return signed, nil
}
