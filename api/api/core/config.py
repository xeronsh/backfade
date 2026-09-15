from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="BACKFADE_", env_file=".env", extra="ignore"
    )

    environment: str = Field(default="development", validation_alias="BACKFADE_ENV")
    llm_api_key: str | None = Field(
        default=None, validation_alias="BACKFADE_LLM_API_KEY"
    )
    llm_base_url: str = Field(
        default="https://api.openai.com/v1", validation_alias="BACKFADE_LLM_BASE_URL"
    )
    llm_model: str = Field(default="gpt-4o-mini", validation_alias="BACKFADE_LLM_MODEL")
    cors_origins: str = Field(
        default="http://localhost:5173", validation_alias="BACKFADE_CORS_ORIGINS"
    )
    log_level: str = Field(default="INFO", validation_alias="BACKFADE_LOG_LEVEL")
    http_timeout: float = Field(
        default=20.0, gt=0, validation_alias="BACKFADE_HTTP_TIMEOUT"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]

    @property
    def llm_enabled(self) -> bool:
        return bool(self.llm_api_key)

    def validate_runtime(self) -> None:
        if self.environment.lower() == "production" and not self.llm_api_key:
            raise RuntimeError("BACKFADE_LLM_API_KEY is required in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()
