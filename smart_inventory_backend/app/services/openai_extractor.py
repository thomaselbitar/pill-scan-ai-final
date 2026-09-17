import base64
import json
from typing import Any

from openai import OpenAI

from app.constants.product_fields import (
    FORMS,
    USE_TYPES,
    WEIGHT_UNITS,
    normalize_extraction_payload,
)


class OpenAIConfigurationError(Exception):
    """Missing or invalid OpenAI configuration."""


class OpenAIExtractionError(Exception):
    """OpenAI call or response parsing failed."""


def _mime_for_data_url(content_type: str | None) -> str:
    if not content_type:
        return "image/jpeg"

    ct = content_type.split(";")[0].strip().lower()

    if ct == "image/jpg":
        return "image/jpeg"

    if ct.startswith("image/"):
        return ct

    return "image/jpeg"


def _build_system_prompt() -> str:
    return (
        "You are a pharmaceutical packaging analyst. Inspect the product image "
        "and extract structured product information visible on the package.\n\n"
        "Return ONLY valid JSON using exactly these keys:\n"
        '{"product_name": string, "weight_num": number, '
        '"weight_unit": string, "form": string, "use_type": string}\n\n'
        "Rules:\n"
        "- product_name: brand/product name as shown on the package (concise).\n"
        "- weight_num: numeric strength or pack size number only (e.g. 500, 30). "
        "Use 0 if unknown.\n"
        f"- weight_unit: MUST be exactly one of: {json.dumps(WEIGHT_UNITS)}\n"
        f"- form: MUST be exactly one of: {json.dumps(FORMS)}\n"
        f"- use_type: MUST be exactly one of: {json.dumps(USE_TYPES)}\n"
        'Do not invent values outside those lists. If uncertain, use "other" '
        'for unit/form and "Other" for use_type.'
    )


def _parse_response_text(response: Any) -> str:
    """
    Extract text from the OpenAI Responses API result.
    """
    output_text = getattr(response, "output_text", None)

    if output_text:
        return output_text.strip()

    # Fallback in case output_text is unavailable.
    try:
        parts = []

        for item in response.output:
            for content in item.content:
                text = getattr(content, "text", None)

                if text:
                    parts.append(text)

        return "\n".join(parts).strip()

    except (AttributeError, TypeError):
        return ""


async def extract_product_from_image(
    image_bytes: bytes,
    content_type: str | None,
) -> dict:
    api_key = __import__("os").environ.get("OPENAI_API_KEY")

    if not api_key:
        raise OpenAIConfigurationError(
            "OPENAI_API_KEY is not set"
        )

    if not image_bytes:
        raise OpenAIExtractionError("Empty image")

    mime = _mime_for_data_url(content_type)

    b64 = base64.standard_b64encode(image_bytes).decode("ascii")

    data_url = f"data:{mime};base64,{b64}"

    client = OpenAI(api_key=api_key)

    try:
        response = client.responses.create(
            model="gpt-5-mini",
            instructions=_build_system_prompt(),
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                          "text": (
    "Analyze this pharmaceutical product package image and extract "
    "the product name, weight/strength number, unit, form, and use type. "
    "Return the result as valid JSON."
),
                        },
                        {
                            "type": "input_image",
                            "image_url": data_url,
                            "detail": "high",
                        },
                    ],
                }
            ],
            text={
                "format": {
                    "type": "json_object",
                }
            },
            
        )

    except Exception as exc:
        print("OPENAI API ERROR:", repr(exc))

        raise OpenAIExtractionError(
            f"OpenAI request failed: {exc}"
        ) from exc

    content = _parse_response_text(response)

    if not content:
        raise OpenAIExtractionError(
            "OpenAI returned an empty response"
        )

    try:
        parsed = json.loads(content)

    except json.JSONDecodeError as exc:
        print("OPENAI RAW RESPONSE:", content)

        raise OpenAIExtractionError(
            "Failed to parse OpenAI JSON"
        ) from exc

    try:
        return normalize_extraction_payload(parsed)

    except ValueError as exc:
        print("OPENAI PARSED DATA:", parsed)

        raise OpenAIExtractionError(
            "Invalid extraction payload"
        ) from exc