from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8081
    go_api_url: str = "http://localhost:8080"
    internal_api_key: str = "dev-internal-key-change-me"
    log_level: str = "info"
    simulation_seconds: int = 12


settings = Settings()
