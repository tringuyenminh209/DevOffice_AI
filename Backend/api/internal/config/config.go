package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                     string
	AllowedOrigins           []string
	DatabaseURL              string
	JWTSecret                string
	InternalAPIKey           string
	WorkerURL                string
	LogLevel                 string
	DevMode                  bool
	DevInProcessWorker       bool
	SupabaseURL              string
	SupabaseServiceRoleKey   string
	StorageBucketTaskResults string
}

func Load() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		Port:                     env("PORT", "8080"),
		AllowedOrigins:           splitCSV(env("ALLOWED_ORIGINS", "http://localhost:5173")),
		DatabaseURL:              mustEnv("DATABASE_URL"),
		JWTSecret:                mustEnv("SUPABASE_JWT_SECRET"),
		InternalAPIKey:           mustEnv("INTERNAL_API_KEY"),
		WorkerURL:                env("WORKER_URL", "http://localhost:8081"),
		LogLevel:                 env("LOG_LEVEL", "info"),
		DevMode:                  env("DEV_MODE", "false") == "true",
		DevInProcessWorker:       env("DEV_INPROCESS_WORKER", "false") == "true",
		SupabaseURL:              env("SUPABASE_URL", ""),
		SupabaseServiceRoleKey:   env("SUPABASE_SERVICE_ROLE_KEY", ""),
		StorageBucketTaskResults: env("STORAGE_BUCKET_TASK_RESULTS", "task-results"),
	}
	return cfg
}

func env(k, def string) string {
	if v, ok := os.LookupEnv(k); ok && v != "" {
		return v
	}
	return def
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("missing required env var: %s", k)
	}
	return v
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
