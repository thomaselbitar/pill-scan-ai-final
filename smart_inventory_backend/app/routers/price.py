# app/routers/price.py
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.price_predictor import PriceModel

router = APIRouter(prefix="/price", tags=["AI - Price"])

price_model = PriceModel()


class PriceRequest(BaseModel):
    product_name: str
    weight_num: float
    weight_unit: str
    form: str
    use_type: str


@router.post("/predict")
async def predict_price(data: PriceRequest):
    price = price_model.predict(
        product_name=data.product_name,
        weight_num=data.weight_num,
        weight_unit=data.weight_unit,
        form=data.form,
        use_type=data.use_type,
    )
    return {"predicted_price": price}
