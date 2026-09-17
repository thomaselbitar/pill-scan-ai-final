# app/routers/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import bcrypt

from app.database.connection import db

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
async def register(data: RegisterRequest):
    existing = db.users.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    result = db.users.insert_one({
        "username": data.username,
        "password_hash": hashed,
        "created_at": datetime.utcnow()
    })

    return {
        "user_id": str(result.inserted_id),
        "username": data.username
    }


@router.post("/login")
async def login(data: LoginRequest):
    user = db.users.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not bcrypt.checkpw(
        data.password.encode("utf-8"),
        user["password_hash"].encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # SIMPLE: return username as "session id"
    return {
        "user_id": str(user["_id"]),
        "username": user["username"]
    }
