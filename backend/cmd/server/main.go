package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/rs/cors"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/ticketon/tap/internal/config"
	"github.com/ticketon/tap/internal/db"
	adminhandler "github.com/ticketon/tap/internal/handler/admin"
	"github.com/ticketon/tap/internal/handler/partner"
	"github.com/ticketon/tap/internal/handler/tracking"
	"github.com/ticketon/tap/internal/middleware"
	"github.com/ticketon/tap/internal/repository"
	"github.com/ticketon/tap/internal/service"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	cfg := config.Load()

	pool, err := db.Connect(cfg.DB.DSN)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer pool.Close()

	_, filename, _, _ := runtime.Caller(0)
	migrationsDir := filepath.Join(filepath.Dir(filename), "..", "..", "internal", "db", "migrations")
	if err := db.RunMigrations(pool, migrationsDir); err != nil {
		log.Fatal().Err(err).Msg("failed to run migrations")
	}
	log.Info().Msg("migrations applied")

	// Repositories
	partnerRepo := repository.NewPartnerRepo(pool)
	eventRepo := repository.NewEventRepo(pool)
	trackingRepo := repository.NewTrackingRepo(pool)
	commRepo := repository.NewCommissionRepo(pool)
	payoutRepo := repository.NewPayoutRepo(pool)
	docRepo := repository.NewDocumentRepo(pool)
	adminRepo := repository.NewAdminRepo(pool)

	// Services
	authSvc := service.NewAuthService(partnerRepo, adminRepo, &cfg.JWT)
	commSvc := service.NewCommissionService(commRepo, partnerRepo)
	trackingSvc := service.NewTrackingService(trackingRepo, partnerRepo, eventRepo, commSvc, &cfg.Tracking)
	payoutSvc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, &cfg.Payout)
	docSvc := service.NewDocumentService(docRepo, partnerRepo)

	// Handlers
	partnerAuth := partner.NewAuthHandler(authSvc)
	partnerProfile := partner.NewProfileHandler(partnerRepo)
	partnerEvents := partner.NewEventsHandler(eventRepo)
	partnerLinks := partner.NewLinksHandler(trackingSvc)
	partnerPayouts := partner.NewPayoutsHandler(payoutSvc)
	partnerDocs := partner.NewDocumentsHandler(docSvc)

	trackHandler := tracking.NewTrackHandler(trackingSvc)

	adminAuth := adminhandler.NewAuthHandler(authSvc, adminRepo)
	adminPartners := adminhandler.NewPartnersHandler(partnerRepo, adminRepo)
	adminComm := adminhandler.NewCommissionsHandler(commSvc, commRepo)
	adminPayouts := adminhandler.NewAdminPayoutsHandler(payoutSvc)
	adminAnalytics := adminhandler.NewAnalyticsHandler(adminRepo)
	adminDocs := adminhandler.NewAdminDocumentsHandler(docSvc, adminRepo)
	adminFraud := adminhandler.NewFraudHandler(trackingRepo)

	// Router
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(middleware.Logger)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{cfg.Server.FrontendURL, "http://localhost:5173", "http://localhost:5174"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Accept"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	r.Use(corsHandler.Handler)

	// Public: tracking redirect
	r.Get("/track/{click_id}", trackHandler.Track)

	// Webhook from Ticketon core
	r.Post("/api/v1/webhook/order", trackHandler.OrderWebhook)

	// Health
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Partner auth (public)
	r.Post("/api/v1/partner/auth/register", partnerAuth.Register)
	r.Post("/api/v1/partner/auth/login", partnerAuth.Login)

	// Partner protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequirePartner(cfg.JWT.Secret))

		r.Get("/api/v1/partner/profile", partnerProfile.Get)
		r.Put("/api/v1/partner/profile", partnerProfile.Update)
		r.Post("/api/v1/partner/kyc", partnerProfile.SubmitKYC)
		r.Post("/api/v1/partner/offer/accept", partnerProfile.AcceptOffer)

		r.Get("/api/v1/partner/events", partnerEvents.List)
		r.Get("/api/v1/partner/events/filters", partnerEvents.GetFilters)
		r.Get("/api/v1/partner/events/{id}", partnerEvents.Get)

		r.Post("/api/v1/partner/links/generate", partnerLinks.Generate)
		r.Get("/api/v1/partner/stats", partnerLinks.GetStats)
		r.Get("/api/v1/partner/stats/series", partnerLinks.GetTimeSeries)

		r.Get("/api/v1/partner/payouts", partnerPayouts.List)
		r.Post("/api/v1/partner/payouts/request", partnerPayouts.Request)
		r.Get("/api/v1/partner/payouts/balance", partnerPayouts.GetBalance)

		r.Get("/api/v1/partner/documents", partnerDocs.List)
		r.Post("/api/v1/partner/documents", partnerDocs.Initiate)
		r.Post("/api/v1/partner/documents/{id}/upload-signed", partnerDocs.UploadSigned)
		r.Get("/api/v1/partner/documents/{id}/download", partnerDocs.GetDownload)
	})

	// Admin auth (public)
	r.Post("/api/v1/admin/auth/login", adminAuth.Login)

	// Admin protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAdmin(cfg.JWT.Secret))

		r.Get("/api/v1/admin/me", adminAuth.Me)

		r.Get("/api/v1/admin/partners", adminPartners.List)
		r.Get("/api/v1/admin/partners/{id}", adminPartners.Get)
		r.Patch("/api/v1/admin/partners/{id}/status", adminPartners.UpdateStatus)
		r.Patch("/api/v1/admin/partners/{id}/tier", adminPartners.UpdateTier)

		r.Get("/api/v1/admin/tariffs", adminComm.GetTariffs)
		r.Put("/api/v1/admin/tariffs", adminComm.UpdateTariff)
		r.Get("/api/v1/admin/commissions", adminComm.List)
		r.Post("/api/v1/admin/commissions/approve-all", adminComm.ApproveAll)

		r.Get("/api/v1/admin/payouts", adminPayouts.List)
		r.Patch("/api/v1/admin/payouts/{id}/status", adminPayouts.UpdateStatus)
		r.Get("/api/v1/admin/payouts/export", adminPayouts.ExportCSV)

		r.Get("/api/v1/admin/analytics", adminAnalytics.GetChannelROI)

		r.Get("/api/v1/admin/documents", adminDocs.List)
		r.Get("/api/v1/admin/documents/{id}", adminDocs.GetDoc)
		r.Get("/api/v1/admin/documents/{id}/download-url", adminDocs.GetDownloadURL)
		r.Post("/api/v1/admin/documents/{id}/sign", adminDocs.Sign)
		r.Post("/api/v1/admin/documents/{id}/reject", adminDocs.Reject)

		r.Get("/api/v1/admin/fraud/signals", adminFraud.GetSignals)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info().Str("port", cfg.Server.Port).Msg("TAP backend starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("server shutdown error")
	}
	log.Info().Msg("server stopped")
}
