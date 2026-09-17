# API Configuration Guide

## Backend URL Configuration

The API base URL is configured in `services/api.js`. By default, it's set to:
- Development: `http://localhost:8000`
- Production: `https://your-production-api.com`

## How to Update the API URL

1. Open `smart_inventory_frontend/services/api.js`
2. Find the `BASE_URL` constant (around line 8)
3. Update it based on your environment:

### For Development:

**Android Emulator:**
```javascript
const BASE_URL = 'http://10.0.2.2:8000';
```

**iOS Simulator:**
```javascript
const BASE_URL = 'http://localhost:8000';
```

**Physical Device (same network):**
```javascript
const BASE_URL = 'http://YOUR_COMPUTER_IP:8000';
// Example: 'http://192.168.1.100:8000'
```

### For Production:
```javascript
const BASE_URL = 'https://your-production-api.com';
```

## Backend CORS Configuration

Make sure your FastAPI backend allows requests from your frontend. Add CORS middleware in `smart_inventory_backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Smart Inventory Backend",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... rest of your code
```

## Testing the Connection

1. Start your backend server:
   ```bash
   cd smart_inventory_backend
   uvicorn app.main:app --reload
   ```

2. Verify the backend is running by visiting:
   - `http://localhost:8000` (should show JSON response)

3. Test the frontend connection:
   - The app will automatically use the configured API URL
   - Check the console for any connection errors

## Available API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Classification
- `POST /classify` - Classify product image

### Price Prediction
- `POST /price/predict` - Predict product price

### Products
- `POST /products/check` - Check if product exists
- `POST /products/add` - Add or update product
- `GET /products/all` - Get all products
- `PUT /products/edit/{product_id}` - Edit product
- `POST /products/remove_quantity/{product_id}` - Remove quantity
- `GET /products/logs` - Get activity logs

