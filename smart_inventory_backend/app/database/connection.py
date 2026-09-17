# app/database/connection.py
from pymongo import MongoClient
import gridfs

client = MongoClient("mongodb://localhost:27017")
db = client["smart_inventory"]  # collections: users, products, activity_logs
fs = gridfs.GridFS(db)
