"""Backfade Thesis Compiler API. No DB, no queue, five endpoints max."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from api.assets import load_assets, symbol_to_feed
from api.llm import compile_thesis, llm_enabled
from api.models import CompileRequest, ErrorResponse, ThesisSpec
from api.validator import ValidationError, validate_spec


@asynccontextmanager
async def lifespan(app: FastAPI):
    symbol_to_feed()  # warm the asset cache; fail fast if assets.json is broken
    yield


app = FastAPI(title="Backfade Thesis Compiler", version="0.1.0", lifespan=lifespan)


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
