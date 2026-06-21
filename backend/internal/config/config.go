package config

import (
	"os"
	"strconv"
)

type Config struct {
	Server   ServerConfig
	DB       DBConfig
	JWT      JWTConfig
	S3       S3Config
	Tracking TrackingConfig
	Payout   PayoutConfig
}

type ServerConfig struct {
	Port        string
	Environment string
	FrontendURL string
}

type DBConfig struct {
	DSN string
}

type JWTConfig struct {
	Secret          string
	ExpiryHours     int
	RefreshExpHours int
}

type S3Config struct {
	Endpoint  string
	Bucket    string
	AccessKey string
	SecretKey string
	Region    string
}

type TrackingConfig struct {
	CookieWindowDays int
	BaseRedirectURL  string
	TrackingBaseURL  string
}

type PayoutConfig struct {
	MinThreshold float64
	Currency     string
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:        getEnv("PORT", "8080"),
			Environment: getEnv("ENVIRONMENT", "development"),
			FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		},
		DB: DBConfig{
			DSN: getEnv("DATABASE_URL", "postgres://tap:tap@localhost:5432/tap?sslmode=disable"),
		},
		JWT: JWTConfig{
			Secret:          getEnv("JWT_SECRET", "change-me-in-production-secret-key"),
			ExpiryHours:     getEnvInt("JWT_EXPIRY_HOURS", 24),
			RefreshExpHours: getEnvInt("JWT_REFRESH_EXPIRY_HOURS", 168),
		},
		S3: S3Config{
			Endpoint:  getEnv("S3_ENDPOINT", "http://localhost:9000"),
			Bucket:    getEnv("S3_BUCKET", "tap-documents"),
			AccessKey: getEnv("S3_ACCESS_KEY", "minioadmin"),
			SecretKey: getEnv("S3_SECRET_KEY", "minioadmin"),
			Region:    getEnv("S3_REGION", "us-east-1"),
		},
		Tracking: TrackingConfig{
			CookieWindowDays: getEnvInt("COOKIE_WINDOW_DAYS", 30),
			BaseRedirectURL:  getEnv("BASE_REDIRECT_URL", "https://ticketon.kz"),
			TrackingBaseURL:  getEnv("TRACKING_BASE_URL", "http://localhost:8080"),
		},
		Payout: PayoutConfig{
			MinThreshold: getEnvFloat("PAYOUT_MIN_THRESHOLD", 5000),
			Currency:     getEnv("PAYOUT_CURRENCY", "KZT"),
		},
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return fallback
}
