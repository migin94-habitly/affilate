// Package tests contains end-to-end API integration tests against a running backend.
// Run with: DATABASE_URL=... JWT_SECRET=... go test ./tests/ -v -count=1
package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
	"time"
)

const defaultBaseURL = "http://localhost:8080"

func baseURL() string {
	if u := os.Getenv("TAP_BASE_URL"); u != "" {
		return u
	}
	return defaultBaseURL
}

// --- HTTP helpers ---

func doJSON(t *testing.T, method, path string, body any, token string) (int, map[string]any) {
	t.Helper()
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal request body: %v", err)
		}
		reqBody = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, baseURL()+path, reqBody)
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("do request %s %s: %v", method, path, err)
	}
	defer resp.Body.Close()

	rawBody, _ := io.ReadAll(resp.Body)
	// Try to decode as map first; fall back to wrapping arrays/primitives
	var result map[string]any
	if json.Unmarshal(rawBody, &result) != nil {
		// Response is an array or primitive — wrap it
		var arrResult any
		json.Unmarshal(rawBody, &arrResult)
		result = map[string]any{"_raw": arrResult}
	}
	return resp.StatusCode, result
}

// doJSONRaw returns the raw decoded JSON value (handles arrays too).
func doJSONRaw(t *testing.T, method, path string, body any, token string) (int, any) {
	t.Helper()
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal request body: %v", err)
		}
		reqBody = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, baseURL()+path, reqBody)
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("do request %s %s: %v", method, path, err)
	}
	defer resp.Body.Close()

	var result any
	json.NewDecoder(resp.Body).Decode(&result)
	return resp.StatusCode, result
}

func uniqueEmail() string {
	return fmt.Sprintf("test-%d@integration.test", time.Now().UnixNano())
}

// --- Test suite ---

func TestHealth(t *testing.T) {
	status, body := doJSON(t, "GET", "/health", nil, "")
	if status != http.StatusOK {
		t.Errorf("health status = %d, want 200", status)
	}
	if body["status"] != "ok" {
		t.Errorf("health body = %v, want status:ok", body)
	}
}

func TestPartnerRegister_Success(t *testing.T) {
	email := uniqueEmail()
	status, body := doJSON(t, "POST", "/api/v1/partner/auth/register", map[string]any{
		"email":     email,
		"password":  "TestPass123!",
		"full_name": "Integration Test Partner",
		"segment":   "influencer",
		"language":  "ru",
		"country":   "KZ",
	}, "")

	if status != http.StatusCreated {
		t.Errorf("register status = %d, want 201; body: %v", status, body)
	}
	if body["token"] == nil {
		t.Error("register response missing token")
	}
	if body["partner"] == nil {
		t.Error("register response missing partner")
	}
}

func TestPartnerRegister_MissingFields(t *testing.T) {
	status, _ := doJSON(t, "POST", "/api/v1/partner/auth/register", map[string]any{
		"email": "incomplete@test.com",
		// missing password and full_name
	}, "")
	if status != http.StatusBadRequest {
		t.Errorf("register without required fields: status = %d, want 400", status)
	}
}

func TestPartnerRegister_DuplicateEmail(t *testing.T) {
	email := uniqueEmail()
	payload := map[string]any{
		"email":     email,
		"password":  "pass123",
		"full_name": "Dup Test",
		"segment":   "ugc",
	}
	doJSON(t, "POST", "/api/v1/partner/auth/register", payload, "")

	status, _ := doJSON(t, "POST", "/api/v1/partner/auth/register", payload, "")
	if status != http.StatusConflict {
		t.Errorf("duplicate register status = %d, want 409", status)
	}
}

func registerAndLogin(t *testing.T) (string, string) {
	t.Helper()
	email := uniqueEmail()
	password := "SecurePass999!"

	regStatus, _ := doJSON(t, "POST", "/api/v1/partner/auth/register", map[string]any{
		"email":     email,
		"password":  password,
		"full_name": "Auth Flow Partner",
		"segment":   "influencer",
		"language":  "ru",
		"country":   "KZ",
	}, "")
	if regStatus != http.StatusCreated {
		t.Fatalf("registration failed with status %d", regStatus)
	}

	loginStatus, body := doJSON(t, "POST", "/api/v1/partner/auth/login", map[string]any{
		"email":    email,
		"password": password,
	}, "")
	if loginStatus != http.StatusOK {
		t.Fatalf("login failed with status %d", loginStatus)
	}

	token, _ := body["token"].(string)
	refreshToken, _ := body["refresh_token"].(string)
	return token, refreshToken
}

func TestPartnerLogin_Success(t *testing.T) {
	token, _ := registerAndLogin(t)
	if token == "" {
		t.Error("expected non-empty JWT token after login")
	}
}

func TestPartnerLogin_WrongPassword(t *testing.T) {
	email := uniqueEmail()
	doJSON(t, "POST", "/api/v1/partner/auth/register", map[string]any{
		"email":     email,
		"password":  "correct-pass",
		"full_name": "Login Test",
		"segment":   "influencer",
	}, "")

	status, _ := doJSON(t, "POST", "/api/v1/partner/auth/login", map[string]any{
		"email":    email,
		"password": "wrong-pass",
	}, "")
	if status != http.StatusUnauthorized {
		t.Errorf("wrong password login status = %d, want 401", status)
	}
}

func TestPartnerLogin_UnknownEmail(t *testing.T) {
	status, _ := doJSON(t, "POST", "/api/v1/partner/auth/login", map[string]any{
		"email":    "nobody@nowhere.com",
		"password": "pass",
	}, "")
	if status != http.StatusUnauthorized {
		t.Errorf("unknown email login status = %d, want 401", status)
	}
}

func TestPartnerRefreshToken(t *testing.T) {
	_, refreshToken := registerAndLogin(t)

	status, body := doJSON(t, "POST", "/api/v1/partner/auth/refresh", map[string]any{
		"refresh_token": refreshToken,
	}, "")
	if status != http.StatusOK {
		t.Errorf("refresh status = %d, want 200; body: %v", status, body)
	}
	if body["token"] == nil {
		t.Error("refresh response missing new token")
	}
}

func TestPartnerRefreshToken_InvalidToken(t *testing.T) {
	status, _ := doJSON(t, "POST", "/api/v1/partner/auth/refresh", map[string]any{
		"refresh_token": "invalid.jwt.garbage",
	}, "")
	if status != http.StatusUnauthorized {
		t.Errorf("invalid refresh token status = %d, want 401", status)
	}
}

func TestGetProfile_Authenticated(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "GET", "/api/v1/partner/profile", nil, token)
	if status != http.StatusOK {
		t.Errorf("profile status = %d, want 200; body: %v", status, body)
	}
	// Profile returns {partner: {...}, balance: {...}, kyc: null, offer_accepted: false}
	if body["partner"] == nil {
		t.Error("profile missing partner field")
	}
	if body["balance"] == nil {
		t.Error("profile missing balance field")
	}
}

func TestGetProfile_Unauthenticated(t *testing.T) {
	status, _ := doJSON(t, "GET", "/api/v1/partner/profile", nil, "")
	if status != http.StatusUnauthorized {
		t.Errorf("unauthenticated profile status = %d, want 401", status)
	}
}

func TestGetProfile_InvalidToken(t *testing.T) {
	status, _ := doJSON(t, "GET", "/api/v1/partner/profile", nil, "invalid.token")
	if status != http.StatusUnauthorized {
		t.Errorf("invalid token profile status = %d, want 401", status)
	}
}

func TestGetEvents_Authenticated(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "GET", "/api/v1/partner/events", nil, token)
	if status != http.StatusOK {
		t.Errorf("events status = %d, want 200; body: %v", status, body)
	}
	// Should return paginated items
	if _, ok := body["items"]; !ok {
		t.Error("events response missing items field")
	}
}

func TestGenerateLink_NoEvent(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "POST", "/api/v1/partner/links/generate", map[string]any{
		"channel": "telegram",
	}, token)
	// Handler returns 201 Created for a new link
	if status != http.StatusCreated && status != http.StatusOK {
		t.Errorf("generate link status = %d, want 200 or 201; body: %v", status, body)
	}
	if body["click_id"] == nil {
		t.Error("generate link missing click_id")
	}
	if body["tracking_url"] == nil {
		t.Error("generate link missing tracking_url")
	}
	if body["qr_code_url"] == nil {
		t.Error("generate link missing qr_code_url")
	}
}

func TestGetStats(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "GET", "/api/v1/partner/stats?period=month", nil, token)
	if status != http.StatusOK {
		t.Errorf("stats status = %d, want 200; body: %v", status, body)
	}
	if _, ok := body["period"]; !ok {
		t.Error("stats missing period field")
	}
	if _, ok := body["total_clicks"]; !ok {
		t.Error("stats missing total_clicks")
	}
}

func TestGetBalance(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "GET", "/api/v1/partner/payouts/balance", nil, token)
	if status != http.StatusOK {
		t.Errorf("balance status = %d, want 200; body: %v", status, body)
	}
	if _, ok := body["available_amount"]; !ok {
		t.Error("balance missing available_amount")
	}
	if _, ok := body["pending_amount"]; !ok {
		t.Error("balance missing pending_amount")
	}
}

func TestRequestPayout_BelowThreshold(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, _ := doJSON(t, "POST", "/api/v1/partner/payouts/request", map[string]any{
		"amount": 100.0,
	}, token)
	if status != http.StatusBadRequest {
		t.Errorf("payout below threshold status = %d, want 400", status)
	}
}

func TestRequestPayout_NoKYC(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, _ := doJSON(t, "POST", "/api/v1/partner/payouts/request", map[string]any{
		"amount": 10000.0,
	}, token)
	// Should fail — no KYC or insufficient balance
	if status == http.StatusOK {
		t.Error("payout without KYC should not succeed")
	}
}

func TestListPayouts(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "GET", "/api/v1/partner/payouts", nil, token)
	if status != http.StatusOK {
		t.Errorf("list payouts status = %d, want 200; body: %v", status, body)
	}
	if _, ok := body["items"]; !ok {
		t.Error("payouts response missing items")
	}
}

func TestGetPromos(t *testing.T) {
	token, _ := registerAndLogin(t)

	// Promos endpoint returns a JSON array directly
	status, _ := doJSONRaw(t, "GET", "/api/v1/partner/promo-codes", nil, token)
	if status != http.StatusOK {
		t.Errorf("promo codes status = %d, want 200", status)
	}
}

func TestCreatePromo_Success(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "POST", "/api/v1/partner/promo-codes", map[string]any{
		"code": fmt.Sprintf("PROMO%d", time.Now().UnixNano()%100000),
	}, token)
	if status != http.StatusCreated {
		t.Errorf("create promo status = %d, want 201; body: %v", status, body)
	}
	if body["code"] == nil {
		t.Error("create promo response missing code")
	}
}

func TestGetNotifications(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "GET", "/api/v1/partner/notifications", nil, token)
	if status != http.StatusOK {
		t.Errorf("notifications status = %d, want 200; body: %v", status, body)
	}
	if _, ok := body["items"]; !ok {
		t.Error("notifications response missing items")
	}
}

func TestGetFAQ(t *testing.T) {
	token, _ := registerAndLogin(t)

	// FAQ endpoint returns a JSON array directly
	status, _ := doJSONRaw(t, "GET", "/api/v1/partner/faq", nil, token)
	if status != http.StatusOK {
		t.Errorf("faq status = %d, want 200", status)
	}
}

func TestOrderWebhook_WrongSecret(t *testing.T) {
	status, _ := doJSON(t, "POST", "/api/v1/webhook/order", map[string]any{
		"order_id":     "ext-1001",
		"event_id":     "ev-1",
		"buyer_email":  "buyer@test.com",
		"is_new_buyer": false,
		"total_amount": 5000.0,
		"service_fee":  500.0,
		"currency":     "KZT",
		"status":       "completed",
		"secret":       "WRONG-SECRET",
	}, "")
	if status != http.StatusUnauthorized {
		t.Errorf("webhook with wrong secret status = %d, want 401", status)
	}
}

func TestOrderWebhook_ValidNoAttribution(t *testing.T) {
	status, _ := doJSON(t, "POST", "/api/v1/webhook/order", map[string]any{
		"order_id":     fmt.Sprintf("ext-%d", time.Now().UnixNano()),
		"event_id":     "ev-no-attr",
		"buyer_email":  "buyer@test.com",
		"is_new_buyer": false,
		"total_amount": 5000.0,
		"service_fee":  500.0,
		"currency":     "KZT",
		"status":       "completed",
		"secret":       "test-webhook-secret",
	}, "")
	if status != http.StatusOK {
		t.Errorf("webhook without attribution status = %d, want 200", status)
	}
}

func TestTrackingRedirect_UnknownClick(t *testing.T) {
	client := &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse // don't follow redirects
		},
	}
	resp, err := client.Get(baseURL() + "/track/nonexistent-click-id")
	if err != nil {
		t.Fatalf("tracking request error: %v", err)
	}
	defer resp.Body.Close()
	// Should redirect (3xx) to base URL
	if resp.StatusCode < 300 || resp.StatusCode >= 400 {
		t.Errorf("tracking redirect status = %d, want 3xx", resp.StatusCode)
	}
}

func TestAdminLogin_InvalidCredentials(t *testing.T) {
	status, _ := doJSON(t, "POST", "/api/v1/admin/auth/login", map[string]any{
		"email":    "admin@ticketon.kz",
		"password": "wrong",
	}, "")
	if status != http.StatusUnauthorized {
		t.Errorf("admin login wrong pass status = %d, want 401", status)
	}
}

func TestAdminProtectedRoutes_Unauthenticated(t *testing.T) {
	routes := []string{
		"/api/v1/admin/partners",
		"/api/v1/admin/tariffs",
		"/api/v1/admin/commissions",
		"/api/v1/admin/payouts",
		"/api/v1/admin/analytics",
		"/api/v1/admin/fraud/signals",
	}

	for _, route := range routes {
		t.Run(route, func(t *testing.T) {
			status, _ := doJSON(t, "GET", route, nil, "")
			if status != http.StatusUnauthorized {
				t.Errorf("%s with no auth: status = %d, want 401", route, status)
			}
		})
	}
}

func TestGetTimeSeries(t *testing.T) {
	token, _ := registerAndLogin(t)

	status, body := doJSON(t, "GET", "/api/v1/partner/stats/series?days=7", nil, token)
	if status != http.StatusOK {
		t.Errorf("time series status = %d, want 200; body: %v", status, body)
	}
}

func TestGetDocuments(t *testing.T) {
	token, _ := registerAndLogin(t)

	// Documents endpoint returns a JSON array or null (no documents for new partner)
	status, _ := doJSONRaw(t, "GET", "/api/v1/partner/documents", nil, token)
	if status != http.StatusOK {
		t.Errorf("documents status = %d, want 200", status)
	}
}

func TestGetContacts(t *testing.T) {
	token, _ := registerAndLogin(t)

	// Contacts endpoint returns a JSON array directly
	status, raw := doJSONRaw(t, "GET", "/api/v1/partner/contacts", nil, token)
	if status != http.StatusOK {
		t.Errorf("contacts status = %d, want 200", status)
	}
	if raw == nil {
		t.Error("contacts should return non-null value")
	}
}
