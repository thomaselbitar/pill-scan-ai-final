# app/routers/classify.py
import re
from fastapi import APIRouter, UploadFile, File
from PIL import Image

from app.models.classifier import PharmacyClassifier

router = APIRouter(tags=["AI - Classifier"])

classifier = PharmacyClassifier()


def extract_weight_num(name: str):
    match = re.search(r"(\d+)", name)
    return int(match.group(1)) if match else 0


def extract_weight_unit(name: str):
    units = ["g", "gm", "ml", "tablets", "capsules", "caplets", "sachets"]
    lower = name.lower()
    for u in units:
        if u in lower:
            return u
    return "other"


def extract_form(name: str):
    forms = [
        "cream", "syrup", "tablets", "capsules", "caplets", "ointment", "spray",
        "gel", "oral drops", "mouth wash", "solution", "sachets", "hydrogel",
        "tape", "vial", "nasal spray", "liquid", "ear drops", "paint", "inhalation"
    ]
    lower = name.lower()
    for f in forms:
        if f in lower:
            return f
    return "other"


def extract_use_type(name: str):
    n = name.lower()

    if any(k in n for k in ["adol", "brufen", "catafast", "paramol", "ezamol"]):
        return "Pain killer"

    if any(k in n for k in [
        "augmentin", "flumox", "flagyl", "cipro", "dalacin",
        "daktarin", "diflucan", "hayadraxil", "hibiotic"
    ]):
        return "Antibiotic"

    if any(k in n for k in [
        "flector", "dicla", "celebrex", "rheumatizen",
        "alphintern", "ambezim", "hemoclar"
    ]):
        return "Anti-inflammatory"

    if any(k in n for k in [
        "congestal", "flu", "cold", "clari", "zyrtec",
        "fenistil", "histazine"
    ]):
        return "Cold & Flu"

    if any(k in n for k in ["vit", "zinc", "ferro", "primrose", "osteocare"]):
        return "Vitamins / Supplements"

    if any(k in n for k in ["mebo", "fucidin", "fucicort", "pandermal", "panthenol", "betaderm", "zenta"]):
        return "Skin treatment"

    if any(k in n for k in ["salivex", "ear", "eye", "vidrop", "remowax"]):
        return "Eye/Ear"

    if any(k in n for k in ["nose", "spray"]):
        return "Nasal spray"

    if any(k in n for k in ["syrup", "broncho", "ivypront", "mucophylline"]):
        return "Cough syrup / Bronchial"

    if any(k in n for k in ["lax", "picolax", "minalax", "mucosta", "motilium", "renn"]):
        return "Stomach / Digestive"

    return "Other"


@router.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    image = Image.open(file.file)
    prediction_result = classifier.predict(image)
    product_name = prediction_result["product_name"]
    confidence = prediction_result["confidence"]

    weight_num = extract_weight_num(product_name)
    weight_unit = extract_weight_unit(product_name)
    form = extract_form(product_name)
    use_type = extract_use_type(product_name)

    return {
        "product_name": product_name,   # FULL STRING, as you requested
        "weight_num": weight_num,
        "weight_unit": weight_unit,
        "form": form,
        "use_type": use_type,
        "confidence": confidence
    }
