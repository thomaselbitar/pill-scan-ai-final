from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.openai_extractor import (
    OpenAIConfigurationError,
    OpenAIExtractionError,
    extract_product_from_image,
)

router = APIRouter(prefix="/ai", tags=["AI - OpenAI"])

USER_FACING_AI_ERROR = "AI analysis failed. Please try again."


@router.post("/extract-product")
async def extract_product(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()

        result = await extract_product_from_image(
            image_bytes,
            file.content_type,
        )

        return result

    except OpenAIConfigurationError:
        raise HTTPException(
            status_code=503,
            detail="AI extraction is not configured on the server.",
        )

    except OpenAIExtractionError:
        raise HTTPException(
            status_code=502,
            detail=USER_FACING_AI_ERROR,
        )