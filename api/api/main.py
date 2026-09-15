"""Backfade API application: compiler, asset registry, and health only."""

import time
from contextlib import asynccontextmanager
from uuid import uuid4

import httpx
import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.core.config import get_settings
from api.core.logging import configure_logging
from api.models import ErrorBody, ErrorResponse
from api.routers import assets, compiler, health

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    settings.validate_runtime()
    configure_logging(settings.log_level)
    app.state.settings = settings
    app.state.http_client = httpx.AsyncClient(timeout=settings.http_timeout)
    yield
    await app.state.http_client.aclose()


app = FastAPI(title="Backfade Thesis Compiler", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    start = time.perf_counter()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("request.failed", method=request.method, path=request.url.path)
        raise
    finally:
        logger.info(
            "request.complete",
            method=request.method,
            path=request.url.path,
            status=getattr(locals().get("response"), "status_code", 500),
            latency_ms=round((time.perf_counter() - start) * 1000, 2),
        )
        structlog.contextvars.clear_contextvars()
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
    fields = ", ".join(str(item.get("loc", ["request"])[-1]) for item in error.errors())
    body = ErrorResponse(
        error=ErrorBody(
            code="INVALID_REQUEST",
            message=f"Invalid request fields: {fields}",
            retryable=False,
        )
    )
    return JSONResponse(status_code=422, content=body.model_dump())


app.include_router(health.router)
app.include_router(assets.router)
app.include_router(compiler.router)
