from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from api.assets import load_assets, symbol_to_feed
from api.models import CompileRequest, ErrorBody, ErrorResponse, ThesisSpec
from api.services.compiler import compile_narrative
from api.validator import ValidationError

router = APIRouter(prefix="/v1/thesis", tags=["compiler"])


def error_response(
    code: str, message: str, status_code: int, retryable: bool = False
) -> JSONResponse:
    body = ErrorResponse(
        error=ErrorBody(code=code, message=message, retryable=retryable)
    )
    return JSONResponse(status_code=status_code, content=body.model_dump())


@router.post(
    "/compile",
    response_model=ThesisSpec,
    responses={422: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
    operation_id="compileThesis",
)
async def compile_thesis(
    request: Request, payload: CompileRequest
) -> ThesisSpec | JSONResponse:
    try:
        return await compile_narrative(
            payload.text,
            payload.preferred_duration_days,
            load_assets(),
            symbol_to_feed(),
            request.app.state.http_client,
            request.app.state.settings,
        )
    except ValidationError as error:
        return error_response(error.code, error.message, 422)
    except RuntimeError as error:
        return error_response("COMPILE_FAILED", str(error), 503, retryable=True)
