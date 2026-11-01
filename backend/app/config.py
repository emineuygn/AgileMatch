from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./agilematch.db"
    jwt_secret: str = Field(min_length=32)
    jwt_expire_minutes: int = 480
    cors_origins: str = "http://localhost:3000"
    admin_email: str = "ik@sirket.com"
    admin_password: str = ""
    # Takım önerisi hedefi 3 sn; veritabanı ve ağ payı için çözücüye daha azı verilir.
    solver_time_limit_seconds: float = 2.0

    @property
    def sqlalchemy_url(self) -> str:
        # Render adresi postgres:// veya postgresql:// ile verir; sürücü psycopg 3.
        url = self.database_url
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix) :]
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
