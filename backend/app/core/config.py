import json
import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


def normalize_database_url(url: str) -> str:
    """Accept Render/Heroku `postgres://` URLs and force the psycopg2 SQLAlchemy dialect."""
    if not url:
        return url
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://") :]
    return url


def parse_cors_origins(value: object) -> list[str]:
    """Parse CORS origins from a JSON array, comma-separated string, or list."""
    if isinstance(value, list):
        return [str(origin).strip() for origin in value if str(origin).strip()]
    if not value:
        return []
    text = str(value).strip()
    if text.startswith("["):
        parsed = json.loads(text)
        return [str(origin).strip() for origin in parsed if str(origin).strip()]
    return [origin.strip() for origin in text.split(",") if origin.strip()]


try:
    from pydantic import field_validator
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        PROJECT_NAME: str = "Darukaa.Earth API"
        VERSION: str = "0.1.0"
        API_V1_STR: str = "/api/v1"
        ENVIRONMENT: str = "development"

        # Database Configuration
        DATABASE_URL: str = os.getenv(
            "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5433/daruka_earth"
        )

        # JWT Security
        JWT_SECRET: str = os.getenv(
            "JWT_SECRET", "darukaa_development_secret_key_change_in_production_min_32_chars"
        )
        JWT_ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

        # CORS
        BACKEND_CORS_ORIGINS: list[str] = [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ]

        @field_validator("DATABASE_URL", mode="before")
        @classmethod
        def _normalize_database_url(cls, value: str) -> str:
            return normalize_database_url(value)

        @field_validator("BACKEND_CORS_ORIGINS", mode="before")
        @classmethod
        def _parse_cors_origins(cls, value: object) -> list[str]:
            return parse_cors_origins(value)

        # Site AI insights (Groq OpenAI-compatible Chat Completions via httpx)
        GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
        GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        AI_REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30"))

        model_config = SettingsConfigDict(
            env_file=".env", env_file_encoding="utf-8", extra="ignore"
        )

except ImportError:
    # Fallback if pydantic-settings is not installed yet
    class Settings:
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Darukaa.Earth API")
        VERSION: str = os.getenv("VERSION", "0.1.0")
        API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

        DATABASE_URL: str = normalize_database_url(
            os.getenv(
                "DATABASE_URL",
                "postgresql+psycopg2://postgres:postgres@localhost:5433/daruka_earth",
            )
        )

        JWT_SECRET: str = os.getenv(
            "JWT_SECRET", "darukaa_development_secret_key_change_in_production_min_32_chars"
        )
        JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
        ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

        BACKEND_CORS_ORIGINS: list[str] = parse_cors_origins(
            os.getenv(
                "BACKEND_CORS_ORIGINS",
                '["http://localhost:3000","http://localhost:5173"]',
            )
        )

        GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
        GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        AI_REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30"))


settings = Settings()
