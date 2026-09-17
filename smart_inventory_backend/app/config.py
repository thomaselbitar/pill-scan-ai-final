import os

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

DEFAULT_OPENROUTER_MODEL = "google/gemini-2.0-flash-001"


def get_openrouter_api_key() -> str | None:
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    return key or None


def get_openrouter_model() -> str:
    return os.environ.get("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL).strip() or DEFAULT_OPENROUTER_MODEL
