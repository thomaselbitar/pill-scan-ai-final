import base64
import json
import re
from typing import Any

import httpx

from app.config import OPENROUTER_API_URL, get_openrouter_api_key
from app.constants.product_fields import (
    FORMS,
    USE_TYPES,
    WEIGHT_UNITS,
    normalize_extraction_payload,
)


class OpenRouterConfigurationError(Exception):
    """Missing or invalid OpenRouter configuration."""


class OpenRouterExtractionError(Exception):
    """OpenRouter call or response parsing failed."""


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
        "You are a pharmaceutical packaging analyst. Inspect the product image and extract "
        "structured product information visible on the package. "
        "Respond with JSON only, no markdown, using exactly these keys:\n"
        '{"product_name": string, "weight_num": number, "weight_unit": string, '
        '"form": string, "use_type": string}\n\n'
        "Rules:\n"
        "- product_name: brand/product name as shown on the package (concise).\n"
        "- weight_num: numeric strength or pack size number only (e.g. 500, 30). Use 0 if unknown.\n"
        f"- weight_unit: MUST be exactly one of: {json.dumps(WEIGHT_UNITS)}\n"
        f"- form: MUST be exactly one of: {json.dumps(FORMS)}\n"
        f"- use_type: MUST be exactly one of: {json.dumps(USE_TYPES)}\n"
        "Do not invent values outside those lists. If uncertain, use \"other\" for unit/form "
        "and \"Other\" for use_type."
    )


def _extract_json_text(content: str) -> str:
    text = content.strip()

    fence = re.search(
        r"```(?:json)?\s*([\s\S]*?)\s*```",
        text,
        re.IGNORECASE,
    )

    if fence:
        return fence.group(1).strip()

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]

    return text


def _parse_message_content(raw: Any) -> str:
    if isinstance(raw, str):
        return raw

    if isinstance(raw, list):
        parts = []

        for block in raw:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(str(block.get("text", "")))

        return "\n".join(parts)

    return str(raw)


async def extract_product_from_image(
    image_bytes: bytes,
    content_type: str | None,
) -> dict:
    api_key = get_openrouter_api_key()

    if not api_key:
        raise OpenRouterConfigurationError(
            "OPENROUTER_API_KEY is not set"
        )

    if not image_bytes:
        raise OpenRouterExtractionError("Empty image")

    mime = _mime_for_data_url(content_type)

    b64 = base64.standard_b64encode(image_bytes).decode("ascii")

    data_url = f"data:{mime};base64,{b64}"

    # OpenRouter will try these models in order.
    # If the first model is temporarily rate-limited or unavailable,
    # it can fall back to the next model.
    models = [
        "google/gemma-4-26b-a4b-it:free",
        "google/gemma-4-31b-it:free",
    ]

    payload = {
        "models": models,
        "messages": [
            {
                "role": "system",
                "content": _build_system_prompt(),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Extract product name, weight/strength number, unit, "
                            "form, and use type from this pharmaceutical "
                            "product package image."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": data_url,
                        },
                    },
                ],
            },
        ],
        "response_format": {
            "type": "json_object",
        },
        "temperature": 0.1,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pillscan-ai.local",
        "X-Title": "Pill Scan AI",
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload,
            )

    except httpx.HTTPError as exc:
        print("OPENROUTER HTTP ERROR:", repr(exc))

        raise OpenRouterExtractionError(
            f"OpenRouter request failed: {exc}"
        ) from exc

    if response.status_code >= 400:
        print("OPENROUTER STATUS:", response.status_code)
        print("OPENROUTER RESPONSE:", response.text)

        raise OpenRouterExtractionError(
            f"OpenRouter returned status {response.status_code}: "
            f"{response.text}"
        )

    try:
        body = response.json()

        choices = body.get("choices") or []

        if not choices:
            raise OpenRouterExtractionError(
                "No choices in OpenRouter response"
            )

        message = choices[0].get("message") or {}

        content = _parse_message_content(
            message.get("content")
        )

        json_text = _extract_json_text(content)

        parsed = json.loads(json_text)

    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        print("OPENROUTER PARSE ERROR:", repr(exc))
        print("OPENROUTER RAW RESPONSE:", response.text)

        raise OpenRouterExtractionError(
            "Failed to parse OpenRouter JSON"
        ) from exc

    try:
        return normalize_extraction_payload(parsed)

    except ValueError as exc:
        print("OPENROUTER NORMALIZATION ERROR:", repr(exc))
        print("OPENROUTER PARSED DATA:", parsed)

        raise OpenRouterExtractionError(
            "Invalid extraction payload"
        ) from exc