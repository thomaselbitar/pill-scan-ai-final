# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai, auth, classify, price, products

app = FastAPI(
    title="Smart Inventory Backend",
    version="1.0.0"
)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Smart Inventory Backend Running"}


app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(classify.router)
app.include_router(price.router)
app.include_router(products.router)
