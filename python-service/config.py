import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    service_key: str
    allowed_origins: list[str]
    require_auth: bool


@lru_cache
def get_settings() -> Settings:
    load_dotenv()
    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return Settings(
        supabase_url=os.getenv("SUPABASE_URL", ""),
        service_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        allowed_origins=[o.strip() for o in origins.split(",") if o.strip()],
        require_auth=os.getenv("REQUIRE_AUTH", "true").lower() == "true",
    )