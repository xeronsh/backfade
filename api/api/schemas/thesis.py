from typing import Literal

from pydantic import BaseModel, Field


class ThesisAsset(BaseModel):
    symbol: str
    feed: str
    weight_bps: int = Field(ge=1, le=10_000)


class ThesisReference(BaseModel):
    symbol: str
    feed: str


class ThesisSpecV2(BaseModel):
    version: Literal[2]
    narrative: str
    basket: list[ThesisAsset]
    reference: ThesisReference
    reference_origin: Literal["explicit", "suggested"]


class CompileRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2_000)


class ErrorBody(BaseModel):
    code: str
    message: str
    retryable: bool


class ErrorResponse(BaseModel):
    error: ErrorBody


class HealthResponse(BaseModel):
    status: Literal["ok"]
    llm: Literal["enabled", "mock"]
