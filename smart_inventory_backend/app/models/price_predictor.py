# app/models/price_predictor.py
import joblib
import pandas as pd


class PriceModel:
    def __init__(self):
        try:
            self.model = joblib.load("xgboost_price_model.joblib")
            print("XGB price model loaded successfully.")
        except Exception as e:
            print("Error loading xgboost_price_model.joblib:", e)
            raise e

    def predict(self, product_name, weight_num, weight_unit, form, use_type):
        df = pd.DataFrame([{
            "product_name": product_name,
            "weight_num": float(weight_num),
            "weight_unit": weight_unit,
            "form": form,
            "use_type": use_type
        }])

        pred = float(self.model.predict(df)[0])
        # round to 2 decimals
        return round(pred, 2)
