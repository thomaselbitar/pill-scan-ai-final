# Network Error Troubleshooting Guide

If you're getting "Network error" when testing on a physical iPhone, follow these steps:

## 1. Verify Backend is Running

Make sure your backend is running with:
```bash
cd smart_inventory_backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Important:** The `--host 0.0.0.0` flag is required for physical devices!

## 2. Check Your IP Address

Your IP address might have changed. Find it with:
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` or `ip addr`

Update the IP in `services/api.js` if it changed.

## 3. Test Connection from iPhone

On your iPhone, open Safari and go to:
```
http://YOUR_IP_ADDRESS:8000
```

You should see: `{"message":"Smart Inventory Backend Running"}`

If this doesn't work, the backend isn't accessible from your phone.

## 4. Windows Firewall

Windows Firewall might be blocking port 8000:

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "8000"
6. Select "Allow the connection"
7. Apply to all profiles
8. Name it "FastAPI Backend"

Or temporarily disable firewall to test.

## 5. Same WiFi Network

Make sure your iPhone and computer are on the **same WiFi network**.

## 6. Check Backend Logs

Look at your backend terminal. If you see connection attempts, the network is working but there might be an API issue.

## 7. iOS HTTP Restrictions

iOS by default blocks HTTP (non-HTTPS) connections. For development:

1. In Xcode, edit `Info.plist`:
   - Add `NSAppTransportSecurity` dictionary
   - Add `NSAllowsArbitraryLoads` = `YES`

Or use Expo's configuration in `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": true
        }
      }
    }
  }
}
```

## 8. Check Console Logs

In your React Native app, check the console for detailed error messages. The updated error handler will show:
- The exact URL being called
- The error code
- More specific error messages

## Quick Test

Run this in your backend terminal to verify it's listening:
```bash
netstat -an | findstr 8000
```

You should see `0.0.0.0:8000` or `:::8000` in the output.

