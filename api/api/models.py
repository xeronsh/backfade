"""Pydantic models for the Thesis Compiler API."""

from typing import Literal

from pydantic import BaseModel, Field


class ThesisAsset(BaseModel):
    symbol: str
    feed: str
    weight_bps: int


class ThesisBenchmark(BaseModel):
    symbol: str
    feed: str


class ThesisRisk(BaseModel):
    level: Literal["LOW", "MEDIUM", "HIGH"]
    warnings: list[str]


class ThesisSpec(BaseModel):
    version: Literal[1]
    narrative: str
    basket: list[ThesisAsset]
    benchmark: ThesisBenchmark
    hurdle_bps: int
    duration_days: int
    human_condition: str
    risk: ThesisRisk


class CompileRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    preferred_duration_days: int | None = Field(default=None, ge=1, le=365)


class ErrorBody(BaseModel):
    code: str
    message: str
    retryable: bool


class ErrorResponse(BaseModel):
    error: ErrorBody
