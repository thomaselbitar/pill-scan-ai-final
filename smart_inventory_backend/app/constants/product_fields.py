"""Canonical product field values (must match AddResultScreen dropdowns)."""

WEIGHT_UNITS = [
    "g",
    "mg",
    "ml",
    "tablets",
    "capsules",
    "caplets",
    "sachets",
    "spray",
    "drops",
    "vial",
    "tape",
    "ampoules",
    "patch",
    "other",
]

FORMS = [
    "tablets",
    "capsules",
    "caplets",
    "syrup",
    "suspension",
    "cream",
    "ointment",
    "gel",
    "spray",
    "drops",
    "oral drops",
    "nasal spray",
    "solution",
    "mouth wash",
    "liquid",
    "tape",
    "suppository",
    "inhalation",
    "other",
]

USE_TYPES = [
    "Pain killer",
    "Antibiotic",
    "Anti-inflammatory",
    "Cold & Flu",
    "Vitamins / Supplements",
    "Skin treatment",
    "Eye/Ear",
    "Nasal spray",
    "Cough syrup / Bronchial",
    "Stomach / Digestive",
    "Other",
]

_WEIGHT_UNIT_ALIASES = {
    "gm": "g",
    "gram": "g",
    "grams": "g",
    "milligram": "mg",
    "milligrams": "mg",
    "milliliter": "ml",
    "milliliters": "ml",
    "millilitre": "ml",
    "millilitres": "ml",
    "tablet": "tablets",
    "tab": "tablets",
    "tabs": "tablets",
    "capsule": "capsules",
    "cap": "capsules",
    "caps": "capsules",
    "caplet": "caplets",
    "sachet": "sachets",
    "vials": "vial",
    "ampoule": "ampoules",
    "patches": "patch",
}

_FORM_ALIASES = {
    "tablet": "tablets",
    "capsule": "capsules",
    "caplet": "caplets",
    "oint": "ointment",
    "mouthwash": "mouth wash",
    "mouth-wash": "mouth wash",
    "suppositories": "suppository",
    "inhaler": "inhalation",
    "nasal": "nasal spray",
}

_USE_TYPE_KEYWORDS = [
    ("pain killer", "Pain killer"),
    ("analgesic", "Pain killer"),
    ("antibiotic", "Antibiotic"),
    ("anti-inflammatory", "Anti-inflammatory"),
    ("anti inflammatory", "Anti-inflammatory"),
    ("cold & flu", "Cold & Flu"),
    ("cold and flu", "Cold & Flu"),
    ("flu", "Cold & Flu"),
    ("vitamin", "Vitamins / Supplements"),
    ("supplement", "Vitamins / Supplements"),
    ("skin", "Skin treatment"),
    ("dermat", "Skin treatment"),
    ("eye", "Eye/Ear"),
    ("ear", "Eye/Ear"),
    ("nasal spray", "Nasal spray"),
    ("cough", "Cough syrup / Bronchial"),
    ("bronchial", "Cough syrup / Bronchial"),
    ("stomach", "Stomach / Digestive"),
    ("digestive", "Stomach / Digestive"),
]


def _forms_by_length_desc():
    return sorted(FORMS, key=len, reverse=True)


def normalize_weight_unit(value) -> str:
    if value is None:
        return "other"
    raw = str(value).strip().lower()
    if not raw:
        return "other"
    if raw in WEIGHT_UNITS:
        return raw
    if raw in _WEIGHT_UNIT_ALIASES:
        return _WEIGHT_UNIT_ALIASES[raw]
    for unit in WEIGHT_UNITS:
        if unit == "other":
            continue
        if unit in raw or raw in unit:
            return unit
    return "other"


def normalize_form(value) -> str:
    if value is None:
        return "other"
    raw = str(value).strip().lower()
    if not raw:
        return "other"
    if raw in FORMS:
        return raw
    if raw in _FORM_ALIASES:
        return _FORM_ALIASES[raw]
    for form in _forms_by_length_desc():
        if form == "other":
            continue
        if form in raw or raw in form:
            return form
    return "other"


def normalize_use_type(value) -> str:
    if value is None:
        return "Other"
    raw = str(value).strip()
    if not raw:
        return "Other"
    lower = raw.lower()
    for allowed in USE_TYPES:
        if allowed.lower() == lower:
            return allowed
    for keyword, mapped in _USE_TYPE_KEYWORDS:
        if keyword in lower:
            return mapped
    return "Other"


def normalize_weight_num(value) -> float:
    if value is None or value == "":
        return 0.0
    try:
        num = float(value)
        if num < 0:
            return 0.0
        return num
    except (TypeError, ValueError):
        return 0.0


def normalize_product_name(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize_extraction_payload(data: dict) -> dict:
    """Validate and normalize raw LLM JSON into the API response shape."""
    if not isinstance(data, dict):
        raise ValueError("AI response is not a JSON object")

    product_name = normalize_product_name(data.get("product_name"))
    weight_num = normalize_weight_num(data.get("weight_num"))
    weight_unit = normalize_weight_unit(data.get("weight_unit"))
    form = normalize_form(data.get("form"))
    use_type = normalize_use_type(data.get("use_type"))

    return {
        "product_name": product_name,
        "weight_num": weight_num,
        "weight_unit": weight_unit,
        "form": form,
        "use_type": use_type,
        "source": "openrouter",
    }
