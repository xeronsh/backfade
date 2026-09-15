from fastapi import APIRouter

from api.assets import load_assets

router = APIRouter(prefix="/v1", tags=["assets"])


@router.get("/assets", operation_id="listAssets")
async def assets() -> dict[str, list[dict]]:
    return {"assets": [asset for asset in load_assets() if asset.get("enabled")]}
