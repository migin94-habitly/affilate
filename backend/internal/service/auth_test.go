package service_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/config"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/service"
	"github.com/ticketon/tap/internal/testutil"
	"golang.org/x/crypto/bcrypt"
)

func newJWTCfg() *config.JWTConfig {
	return &config.JWTConfig{
		Secret:          "test-secret-key-for-unit-tests",
		ExpiryHours:     1,
		RefreshExpHours: 24,
	}
}

func TestRegisterPartner_Success(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	adminRepo := testutil.NewMockAdminRepo()
	svc := service.NewAuthService(partnerRepo, adminRepo, newJWTCfg())

	result, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "alice@example.com",
		Password: "securepass123",
		FullName: "Alice Smith",
		Segment:  domain.SegmentInfluencer,
	})
	if err != nil {
		t.Fatalf("RegisterPartner error: %v", err)
	}
	if result.Token == "" {
		t.Error("token should not be empty")
	}
	if result.RefreshToken == "" {
		t.Error("refresh token should not be empty")
	}
	if result.Partner == nil {
		t.Fatal("partner should not be nil")
	}
	if result.Partner.Tier != domain.TierBronze {
		t.Errorf("new partner tier = %s, want bronze", result.Partner.Tier)
	}
	if result.Partner.Status != domain.StatusPending {
		t.Errorf("new partner status = %s, want pending", result.Partner.Status)
	}
}

func TestRegisterPartner_DefaultLanguageCountry(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	result, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "bob@example.com",
		Password: "pass",
		FullName: "Bob",
	})
	if err != nil {
		t.Fatalf("RegisterPartner error: %v", err)
	}
	if result.Partner.Language != "ru" {
		t.Errorf("default language = %s, want ru", result.Partner.Language)
	}
	if result.Partner.Country != "KZ" {
		t.Errorf("default country = %s, want KZ", result.Partner.Country)
	}
}

func TestRegisterPartner_DuplicateEmail(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	input := service.RegisterInput{
		Email:    "dup@example.com",
		Password: "pass",
		FullName: "First",
	}
	if _, err := svc.RegisterPartner(context.Background(), input); err != nil {
		t.Fatalf("first registration error: %v", err)
	}

	_, err := svc.RegisterPartner(context.Background(), input)
	if err != domain.ErrAlreadyExists {
		t.Errorf("expected ErrAlreadyExists, got %v", err)
	}
}

func TestLoginPartner_Success(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	// Register first
	if _, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "carol@example.com",
		Password: "mypassword",
		FullName: "Carol",
	}); err != nil {
		t.Fatal(err)
	}

	result, err := svc.LoginPartner(context.Background(), "carol@example.com", "mypassword")
	if err != nil {
		t.Fatalf("LoginPartner error: %v", err)
	}
	if result.Token == "" {
		t.Error("expected non-empty token")
	}
}

func TestLoginPartner_WrongPassword(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	if _, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "dave@example.com",
		Password: "correct",
		FullName: "Dave",
	}); err != nil {
		t.Fatal(err)
	}

	_, err := svc.LoginPartner(context.Background(), "dave@example.com", "wrong")
	if err != domain.ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestLoginPartner_BannedPartner(t *testing.T) {
	partnerID := uuid.New()
	hash, _ := bcrypt.GenerateFromPassword([]byte("pass"), bcrypt.MinCost)
	partnerRepo := testutil.NewMockPartnerRepo()
	partnerRepo.Partners[partnerID] = &domain.Partner{
		ID:           partnerID,
		Email:        "banned@example.com",
		PasswordHash: string(hash),
		Status:       domain.StatusBanned,
	}

	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())
	_, err := svc.LoginPartner(context.Background(), "banned@example.com", "pass")
	if err != domain.ErrPartnerSuspended {
		t.Errorf("expected ErrPartnerSuspended for banned partner, got %v", err)
	}
}

func TestLoginPartner_NotFound(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	_, err := svc.LoginPartner(context.Background(), "nobody@example.com", "pass")
	if err != domain.ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials for unknown email, got %v", err)
	}
}

func TestLoginAdmin_Success(t *testing.T) {
	adminID := uuid.New()
	hash, _ := bcrypt.GenerateFromPassword([]byte("adminpass"), bcrypt.MinCost)
	adminRepo := testutil.NewMockAdminRepo()
	adminRepo.Admins["admin@ticketon.kz"] = &domain.AdminUser{
		ID:           adminID,
		Email:        "admin@ticketon.kz",
		PasswordHash: string(hash),
		Role:         domain.RoleSuperAdmin,
		FullName:     "Super Admin",
	}

	svc := service.NewAuthService(testutil.NewMockPartnerRepo(), adminRepo, newJWTCfg())
	result, err := svc.LoginAdmin(context.Background(), "admin@ticketon.kz", "adminpass")
	if err != nil {
		t.Fatalf("LoginAdmin error: %v", err)
	}
	if result.Token == "" {
		t.Error("expected non-empty token")
	}
	if result.Admin == nil {
		t.Error("expected admin in result")
	}
}

func TestRefreshPartnerToken_Success(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	reg, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "refresh@example.com",
		Password: "pass",
		FullName: "Refresh Test",
	})
	if err != nil {
		t.Fatal(err)
	}

	newResult, err := svc.RefreshPartnerToken(context.Background(), reg.RefreshToken)
	if err != nil {
		t.Fatalf("RefreshPartnerToken error: %v", err)
	}
	if newResult.Token == "" {
		t.Error("expected new access token")
	}
}

func TestRefreshPartnerToken_InvalidToken(t *testing.T) {
	svc := service.NewAuthService(testutil.NewMockPartnerRepo(), testutil.NewMockAdminRepo(), newJWTCfg())
	_, err := svc.RefreshPartnerToken(context.Background(), "invalid.jwt.token")
	if err != domain.ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials for invalid token, got %v", err)
	}
}
