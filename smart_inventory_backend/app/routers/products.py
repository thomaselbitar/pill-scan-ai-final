# app/routers/products.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
from bson import ObjectId
import uuid
from io import BytesIO

from app.database.connection import db, fs

router = APIRouter(prefix="/products", tags=["Products"])


def product_filter(identity: dict):
    # used to check if product already exists
    return {
        "product_name": identity["product_name"],
        "weight_num": identity["weight_num"],
        "weight_unit": identity["weight_unit"],
        "form": identity["form"],
        "use_type": identity["use_type"],
    }


def log_activity(product_id: str, username: str, action: str,
                 quantity_change: int = 0, old_data=None, new_data=None, product_name: str = None):
    log_entry = {
        "product_id": product_id,
        "username": username,
        "action": action,
        "quantity_change": quantity_change,
        "old_data": old_data,
        "new_data": new_data,
        "timestamp": datetime.utcnow()
    }
    # Include product_name if provided
    if product_name:
        log_entry["product_name"] = product_name
    db.activity_logs.insert_one(log_entry)


# ---------- CHECK IF PRODUCT EXISTS (for step "before calling AI 2") ----------
@router.post("/check")
async def check_product(
    product_name: str,
    weight_num: float,
    weight_unit: str,
    form: str,
    use_type: str
):
    identity = {
        "product_name": product_name,
        "weight_num": weight_num,
        "weight_unit": weight_unit,
        "form": form,
        "use_type": use_type
    }

    product = db.products.find_one(product_filter(identity))
    if not product:
        return {"exists": False}

    product["product_id"] = product.get("product_id", "")
    product["_id"] = str(product["_id"])
    if "image_gridfs_id" in product:
        product["image_gridfs_id"] = str(product["image_gridfs_id"])

    return {
        "exists": True,
        "product": product
    }


# ---------- ADD / UPDATE PRODUCT ----------
@router.post("/add")
async def add_product(
    file: UploadFile = File(...),
    username: str = Form(...),

    product_name: str = Form(...),
    weight_num: float = Form(...),
    weight_unit: str = Form(...),
    form: str = Form(...),
    use_type: str = Form(...),

    price: float = Form(...),
    quantity: int = Form(...)
):
    # read image
    img_bytes = await file.read()
    grid_id = fs.put(img_bytes, filename=file.filename)

    identity = {
        "product_name": product_name,
        "weight_num": weight_num,
        "weight_unit": weight_unit,
        "form": form,
        "use_type": use_type,
    }

    existing = db.products.find_one(product_filter(identity))

    if existing:
        # product exists -> only update quantity (and optionally price)
        old = existing.copy()

        new_quantity = int(existing.get("quantity", 0)) + quantity
        update_doc = {
            "quantity": new_quantity,
            "updated_at": datetime.utcnow(),
            "image_gridfs_id": grid_id
        }

        # if user changed price, update it & log
        if float(price) != float(existing.get("price", 0)):
            update_doc["price"] = float(price)

        db.products.update_one(
            {"_id": existing["_id"]},
            {"$set": update_doc}
        )

        log_activity(
            product_id=existing.get("product_id", ""),
            username=username,
            action="ADD_STOCK",
            quantity_change=quantity,
            old_data={"price": old.get("price"), "quantity": old.get("quantity")},
            new_data={"price": price, "quantity": new_quantity},
            product_name=existing.get("product_name", "")
        )

        existing.update(update_doc)
        existing["_id"] = str(existing["_id"])
        existing["image_gridfs_id"] = str(grid_id)

        return {"status": "updated_existing", "product": existing}

    # ---------- NEW PRODUCT ----------
    product_id = str(uuid.uuid4())
    now = datetime.utcnow()

    product = {
        "product_id": product_id,
        "product_name": product_name,
        "weight_num": weight_num,
        "weight_unit": weight_unit,
        "form": form,
        "use_type": use_type,
        "price": float(price),
        "quantity": int(quantity),
        "image_gridfs_id": grid_id,
        "created_at": now,
        "updated_at": now
    }

    result = db.products.insert_one(product)
    product["_id"] = str(result.inserted_id)
    product["image_gridfs_id"] = str(grid_id)

    # Log ADD_STOCK for new product creation
    log_activity(
        product_id=product_id,
        username=username,
        action="ADD_STOCK",
        quantity_change=quantity,
        old_data=None,
        new_data={"price": price, "quantity": quantity},
        product_name=product_name
    )

    return {"status": "created_new", "product": product}


# ---------- LIST ALL PRODUCTS ----------
@router.get("/all")
async def list_products():
    products = []
    for p in db.products.find():
        p["_id"] = str(p["_id"])
        if "image_gridfs_id" in p:
            p["image_gridfs_id"] = str(p["image_gridfs_id"])
        products.append(p)
    return products


# ---------- EDIT PRODUCT DATA ----------
@router.put("/edit/{product_id}")
async def edit_product(
    product_id: str,
    username: str,
    product_name: str,
    weight_num: float,
    weight_unit: str,
    form: str,
    use_type: str,
    price: float
):
    product = db.products.find_one({"product_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old = product.copy()

    update_doc = {
        "product_name": product_name,
        "weight_num": weight_num,
        "weight_unit": weight_unit,
        "form": form,
        "use_type": use_type,
        "price": float(price),
        "updated_at": datetime.utcnow()
    }

    db.products.update_one({"product_id": product_id}, {"$set": update_doc})

    # Don't log EDIT_PRODUCT - only log quantity changes (ADD_STOCK/REMOVE_STOCK)

    product.update(update_doc)
    product["_id"] = str(product["_id"])
    if "image_gridfs_id" in product:
        product["image_gridfs_id"] = str(product["image_gridfs_id"])

    return {"status": "edited", "product": product}


# ---------- REMOVE QUANTITY FROM PRODUCT ----------
@router.post("/remove_quantity/{product_id}")
async def remove_quantity(
    product_id: str,
    username: str,
    quantity: int
):
    product = db.products.find_one({"product_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old_qty = int(product.get("quantity", 0))
    new_qty = max(0, old_qty - quantity)

    db.products.update_one(
        {"product_id": product_id},
        {"$set": {"quantity": new_qty, "updated_at": datetime.utcnow()}}
    )

    log_activity(
        product_id=product_id,
        username=username,
        action="REMOVE_STOCK",
        quantity_change=-quantity,
        old_data={"quantity": old_qty},
        new_data={"quantity": new_qty},
        product_name=product.get("product_name", "")
    )

    return {
        "status": "quantity_updated",
        "old_quantity": old_qty,
        "new_quantity": new_qty
    }


# ---------- DELETE PRODUCT ----------
@router.delete("/delete/{product_id}")
async def delete_product(
    product_id: str,
    username: str
):
    product = db.products.find_one({"product_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Don't log DELETE_PRODUCT - only log quantity changes (ADD_STOCK/REMOVE_STOCK)

    # Delete the product image from GridFS if it exists
    if "image_gridfs_id" in product:
        try:
            grid_id = ObjectId(product["image_gridfs_id"])
            fs.delete(grid_id)
        except Exception as e:
            # Log error but continue with product deletion
            print(f"Error deleting image from GridFS: {e}")

    # Delete the product from database
    db.products.delete_one({"product_id": product_id})

    return {
        "status": "deleted",
        "message": "Product deleted successfully"
    }


# ---------- GET ACTIVITY LOG FOR USER ----------
@router.get("/logs")
async def get_logs(username: str):
    logs = []
    for log in db.activity_logs.find({"username": username}).sort("timestamp", -1):
        log["_id"] = str(log["_id"])
        logs.append(log)
    return logs


# ---------- GET PRODUCT IMAGE ----------
@router.get("/image/{image_gridfs_id}")
async def get_product_image(image_gridfs_id: str):
    try:
        grid_id = ObjectId(image_gridfs_id)
        image_file = fs.get(grid_id)
        image_bytes = image_file.read()
        
        return StreamingResponse(
            BytesIO(image_bytes),
            media_type="image/jpeg",
            headers={"Content-Disposition": f"inline; filename=product_image.jpg"}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Image not found")
