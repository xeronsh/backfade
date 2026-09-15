"""Backfade Thesis Compiler API. No DB, no queue, five endpoints max."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.assets import load_assets, symbol_to_feed
from api.llm import compile_thesis, llm_enabled
from api.models import CompileRequest, ErrorResponse, ThesisSpec
from api.validator import ValidationError, validate_spec

# PHASE 8 §34: explicit origin allowlist, never "*". Comma-separated override via
# BACKFADE_CORS_ORIGINS; the defaults cover local dev plus the production preview port.
DEFAULT_CORS_ORIGINS = [
    "http://127.0.0.1:4173",
    "http://localhost:4173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def cors_origins() -> list[str]:
    raw = os.environ.get("BACKFADE_CORS_ORIGINS", "").strip()
    if not raw:
        return DEFAULT_CORS_ORIGINS
    return [o.strip() for o in raw.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    symbol_to_feed()  # warm the asset cache; fail fast if assets.json is broken
    yield


app = FastAPI(title="Backfade Thesis Compiler", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def error_response(code: str, message: str, status_code: int, retryable: bool = False) -> JSONResponse:
    body = ErrorResponse(error={"code": code, "message": message, "retryable": retryable})
    return JSONResponse(status_code=status_code, content=body.model_dump())


@app.post("/v1/thesis/compile", response_model=None)
async def compile(req: CompileRequest, request: Request) -> JSONResponse | dict:
    universe = load_assets()
    try:
        raw_spec = await compile_thesis(req.text, req.preferred_duration_days, universe)
        spec = validate_spec(raw_spec, symbol_to_feed())
    except ValidationError as e:
        return error_response(e.code, e.message, 422)
    except RuntimeError as e:
        return error_response("COMPILE_FAILED", str(e), 503, retryable=True)
    return spec.model_dump()


@app.get("/v1/assets")
async def assets() -> dict:
    return {"assets": [a for a in load_assets() if a.get("enabled")]}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "llm": "enabled" if llm_enabled() else "mock"}
