package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/devoffice/api/internal/config"
	"github.com/devoffice/api/internal/devworker"
	"github.com/devoffice/api/internal/handler"
	"github.com/devoffice/api/internal/job"
	apimw "github.com/devoffice/api/internal/middleware"
	"github.com/devoffice/api/internal/repository"
	"github.com/devoffice/api/internal/storage"
	"github.com/devoffice/api/internal/worker"
	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
)

func main() {
	cfg := config.Load()

	rootCtx, rootCancel := context.WithCancel(context.Background())
	defer rootCancel()

	pool, err := repository.NewPool(rootCtx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db connect failed: %v", err)
	}
	defer pool.Close()

	companyRepo := repository.NewCompanyRepo(pool)
	taskRepo := repository.NewTaskRepo(pool)
	eventRepo := repository.NewEventRepo(pool)
	approvalRepo := repository.NewApprovalRepo(pool)
	creditsRepo := repository.NewCreditsRepo(pool)

	storageClient := storage.New(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)

	var devSim *devworker.Simulator
	if cfg.DevInProcessWorker {
		simSecs := 12
		if v := os.Getenv("SIMULATION_SECONDS"); v != "" {
			if n, err := strconv.Atoi(v); err == nil && n > 0 {
				simSecs = n
			}
		}
		devSim = devworker.New(devworker.Config{
			Tasks: taskRepo, Events: eventRepo, Approvals: approvalRepo,
			Storage: storageClient, Bucket: cfg.StorageBucketTaskResults,
			SimulationSecs: simSecs,
		})
		log.Printf("devworker: in-process simulator enabled (%ds/task)", simSecs)
	}

	workerClient := worker.NewClient(cfg.WorkerURL, cfg.InternalAPIKey)

	healthH := handler.NewHealthHandler(pool)
	companyH := handler.NewCompanyHandler(companyRepo)
	worldH := handler.NewWorldHandler(companyRepo)
	taskH := handler.NewTaskHandler(handler.TaskHandlerDeps{
		Tasks: taskRepo, Companies: companyRepo, Events: eventRepo,
		Worker: workerClient, DevSim: devSim,
		Storage: storageClient, Bucket: cfg.StorageBucketTaskResults,
	})
	approvalH := handler.NewApprovalHandler(approvalRepo, eventRepo)
	creditsH := handler.NewCreditsHandler(creditsRepo, cfg.DevMode)
	internalH := handler.NewInternalHandler(taskRepo, eventRepo, approvalRepo, storageClient, cfg.StorageBucketTaskResults)

	e := echo.New()
	e.HideBanner = true
	e.HTTPErrorHandler = apimw.ErrorHandler

	e.Use(echomw.Recover())
	e.Use(echomw.RequestID())
	e.Use(echomw.Logger())
	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins: cfg.AllowedOrigins,
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{"Authorization", "Content-Type", "X-Internal-Key", "X-Request-Id"},
	}))

	e.GET("/health", healthH.Liveness)
	e.GET("/health/ready", healthH.Readiness)

	// Public API (Supabase JWT)
	api := e.Group("/api/v1", apimw.SupabaseJWT(cfg.JWTSecret))
	api.GET("/companies", companyH.List)
	api.GET("/companies/:id", companyH.Get)
	api.GET("/world", worldH.Snapshot)
	api.POST("/tasks", taskH.Create)
	api.GET("/tasks", taskH.List)
	api.GET("/tasks/:id", taskH.Get)
	api.GET("/tasks/:id/events", taskH.Events)
	api.GET("/tasks/:id/result", taskH.Result)
	api.GET("/approvals", approvalH.List)
	api.GET("/approvals/:id", approvalH.Get)
	api.PATCH("/approvals/:id", approvalH.Resolve)
	api.GET("/credits/balance", creditsH.Balance)
	api.GET("/credits/transactions", creditsH.Transactions)
	api.POST("/credits/dev-grant", creditsH.DevGrant)

	// Internal API (Worker → Go API, X-Internal-Key)
	internal := e.Group("/internal", apimw.InternalKey(cfg.InternalAPIKey))
	internal.POST("/tasks/:id/event", internalH.PostEvent)
	internal.POST("/tasks/:id/complete", internalH.PostComplete)
	internal.POST("/tasks/:id/fail", internalH.PostFail)
	internal.POST("/approvals", internalH.PostApproval)
	internal.GET("/approvals/:id", internalH.GetApproval)

	// Background jobs
	go job.NewApprovalTimeoutJob(approvalRepo, eventRepo).Run(rootCtx)

	go func() {
		addr := ":" + cfg.Port
		log.Printf("API listening on %s (devMode=%v, devWorker=%v)", addr, cfg.DevMode, cfg.DevInProcessWorker)
		if err := e.Start(addr); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	rootCancel()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
