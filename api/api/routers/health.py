from fastapi import APIRouter

from api.core.config import get_settings
from api.models import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, operation_id="healthCheck")
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok", llm="enabled" if settings.llm_enabled else "mock"
    )
