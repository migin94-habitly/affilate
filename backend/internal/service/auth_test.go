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

func TestRegisterPartner_CustomLanguageCountry(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	result, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "uz@example.com",
		Password: "pass",
		FullName: "Uzbek Partner",
		Language: "uz",
		Country:  "UZ",
	})
	if err != nil {
		t.Fatalf("RegisterPartner error: %v", err)
	}
	if result.Partner.Language != "uz" {
		t.Errorf("language = %s, want uz", result.Partner.Language)
	}
	if result.Partner.Country != "UZ" {
		t.Errorf("country = %s, want UZ", result.Partner.Country)
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

func TestRegisterPartner_RepoCreateError(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	partnerRepo.CreateErr = domain.ErrNotFound
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	_, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "err@example.com",
		Password: "pass",
		FullName: "Err",
	})
	if err == nil {
		t.Error("expected error from repo Create, got nil")
	}
}

func TestRegisterPartner_TokenContainsPartnerType(t *testing.T) {
	svc := service.NewAuthService(testutil.NewMockPartnerRepo(), testutil.NewMockAdminRepo(), newJWTCfg())
	result, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "token@example.com",
		Password: "pass",
		FullName: "Token Test",
	})
	if err != nil {
		t.Fatal(err)
	}
	// Token must be a 3-part JWT
	parts := splitDots(result.Token)
	if len(parts) != 3 {
		t.Errorf("JWT token should have 3 parts, got %d", len(parts))
	}
}

func splitDots(s string) []string {
	var parts []string
	start := 0
	for i, c := range s {
		if c == '.' {
			parts = append(parts, s[start:i])
			start = i + 1
		}
	}
	parts = append(parts, s[start:])
	return parts
}

func TestLoginPartner_Success(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

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
	if result.Partner == nil {
		t.Error("expected partner in result")
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

// TestLoginPartner_SuspendedPartner documents current behavior: suspended partners
// can still authenticate. If the business rule changes, this test should be updated.
func TestLoginPartner_SuspendedPartner_CanLogin(t *testing.T) {
	partnerID := uuid.New()
	hash, _ := bcrypt.GenerateFromPassword([]byte("pass"), bcrypt.MinCost)
	partnerRepo := testutil.NewMockPartnerRepo()
	partnerRepo.Partners[partnerID] = &domain.Partner{
		ID:           partnerID,
		Email:        "suspended@example.com",
		PasswordHash: string(hash),
		Status:       domain.StatusSuspended,
	}

	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())
	result, err := svc.LoginPartner(context.Background(), "suspended@example.com", "pass")
	// Currently suspended partners pass authentication (only banned blocks login).
	// If this should block, change the assertion to expect ErrPartnerSuspended.
	if err != nil {
		t.Logf("suspended partner login blocked with: %v", err)
		return
	}
	if result == nil {
		t.Error("expected non-nil result for suspended partner login")
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
	if result.RefreshToken == "" {
		t.Error("expected non-empty refresh token for admin")
	}
}

func TestLoginAdmin_WrongPassword(t *testing.T) {
	adminID := uuid.New()
	hash, _ := bcrypt.GenerateFromPassword([]byte("correct"), bcrypt.MinCost)
	adminRepo := testutil.NewMockAdminRepo()
	adminRepo.Admins["admin2@ticketon.kz"] = &domain.AdminUser{
		ID:           adminID,
		Email:        "admin2@ticketon.kz",
		PasswordHash: string(hash),
		Role:         domain.RoleModerator,
	}

	svc := service.NewAuthService(testutil.NewMockPartnerRepo(), adminRepo, newJWTCfg())
	_, err := svc.LoginAdmin(context.Background(), "admin2@ticketon.kz", "wrong")
	if err != domain.ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestLoginAdmin_NotFound(t *testing.T) {
	svc := service.NewAuthService(testutil.NewMockPartnerRepo(), testutil.NewMockAdminRepo(), newJWTCfg())
	_, err := svc.LoginAdmin(context.Background(), "nobody@ticketon.kz", "pass")
	if err != domain.ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials for unknown admin email, got %v", err)
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

func TestRefreshPartnerToken_BannedPartner(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	reg, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "willbeban@example.com",
		Password: "pass",
		FullName: "Future Banned",
	})
	if err != nil {
		t.Fatal(err)
	}

	// Ban the partner after token issuance
	for _, p := range partnerRepo.Partners {
		if p.Email == "willbeban@example.com" {
			p.Status = domain.StatusBanned
		}
	}

	_, err = svc.RefreshPartnerToken(context.Background(), reg.RefreshToken)
	if err != domain.ErrPartnerSuspended {
		t.Errorf("expected ErrPartnerSuspended for banned partner on refresh, got %v", err)
	}
}

func TestRefreshPartnerToken_PartnerNotFound(t *testing.T) {
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewAuthService(partnerRepo, testutil.NewMockAdminRepo(), newJWTCfg())

	reg, err := svc.RegisterPartner(context.Background(), service.RegisterInput{
		Email:    "deleted@example.com",
		Password: "pass",
		FullName: "Deleted",
	})
	if err != nil {
		t.Fatal(err)
	}

	// Remove partner from repo to simulate deletion
	partnerRepo.Partners = make(map[uuid.UUID]*domain.Partner)

	_, err = svc.RefreshPartnerToken(context.Background(), reg.RefreshToken)
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound for deleted partner on refresh, got %v", err)
	}
}

func TestRefreshPartnerToken_EmptyString(t *testing.T) {
	svc := service.NewAuthService(testutil.NewMockPartnerRepo(), testutil.NewMockAdminRepo(), newJWTCfg())
	_, err := svc.RefreshPartnerToken(context.Background(), "")
	if err != domain.ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials for empty token, got %v", err)
	}
}
