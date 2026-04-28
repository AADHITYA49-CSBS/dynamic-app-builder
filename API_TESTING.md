# Complete API Testing Guide

## ✅ API Endpoints Status

### Server Information
- **Backend Server:** Running on `http://localhost:5000`
- **Swagger UI:** `http://localhost:5000/api-docs`
- **Available Endpoints:**
  - `GET /config` - Fetch form configuration
  - `POST /api/{entity}` - Submit form data

---

## 🧪 STEP 1: Test GET /config Endpoint

### Using cURL
```powershell
curl -UseBasicParsing http://localhost:5000/config
```

**Expected Response:**
```json
{
  "entity": "User",
  "fields": [
    { "name": "name", "type": "text" },
    { "name": "age", "type": "number" }
  ]
}
```

**Status:** ✅ 200 OK

---

## 🧪 STEP 2: Test POST /api/User - Valid Data ✅

### Using cURL
```powershell
$body = @{
    name = "Aadhitya"
    age = 21
} | ConvertTo-Json

curl -UseBasicParsing -Method POST `
  -Uri http://localhost:5000/api/User `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "message": "User saved successfully",
  "data": {
    "name": "Aadhitya",
    "age": 21
  }
}
```

**Status:** ✅ 201 Created

**Backend Terminal Output:**
```
[2026-04-28T...] Received POST request for entity: User
Validated Data: { name: 'Aadhitya', age: 21 }
```

---

## 🧪 STEP 3: Test POST /api/User - Missing Required Field ❌

### Using cURL
```powershell
$body = @{
    age = 25
} | ConvertTo-Json

curl -UseBasicParsing -Method POST `
  -Uri http://localhost:5000/api/User `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "error": "Missing required field: name"
}
```

**Status:** ❌ 400 Bad Request

---

## 🧪 STEP 4: Test POST /api/User - Extra Fields (Should be Ignored) ✅

### Using cURL
```powershell
$body = @{
    name = "John Doe"
    age = 30
    email = "john@example.com"
    phone = "9876543210"
    country = "India"
} | ConvertTo-Json

curl -UseBasicParsing -Method POST `
  -Uri http://localhost:5000/api/User `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "message": "User saved successfully",
  "data": {
    "name": "John Doe",
    "age": 30
  }
}
```

**Status:** ✅ 201 Created

**Note:** `email`, `phone`, and `country` are **ignored** because they're not in the config

---

## 🧪 STEP 5: Test POST /api/User - Empty Body ❌

### Using cURL
```powershell
$body = @{} | ConvertTo-Json

curl -UseBasicParsing -Method POST `
  -Uri http://localhost:5000/api/User `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "error": "Request body cannot be empty"
}
```

**Status:** ❌ 400 Bad Request

---

## 📋 Complete Testing Checklist

✅ = Test Passes | ❌ = Test Fails | ⚠️ = Needs Attention

| # | Test | Method | URL | Expected Status | Expected Result |
|---|------|--------|-----|-----------------|-----------------|
| 1 | Get Config | GET | /config | 200 ✅ | Returns form structure |
| 2 | Valid Submission | POST | /api/User | 201 ✅ | Returns "User saved successfully" |
| 3 | Missing Field | POST | /api/User | 400 ✅ | Returns "Missing required field: name" |
| 4 | Extra Fields | POST | /api/User | 201 ✅ | Ignores extra fields, returns only valid |
| 5 | Empty Body | POST | /api/User | 400 ✅ | Returns "Request body cannot be empty" |

---

## 🌐 Using Swagger UI (Browser)

1. **Open:** `http://localhost:5000/api-docs`
2. You should see Swagger UI with all endpoints
3. Click on each endpoint and click "Try it out"
4. Fill in the request details and click "Execute"
5. See the response directly in the UI

---

## 📊 API Response Summary

### Success Response (201)
```json
{
  "message": "User saved successfully",
  "data": {
    "name": "...",
    "age": ...
  }
}
```

### Validation Error Response (400)
```json
{
  "error": "Missing required field: name"
}
```

### Server Error Response (500)
```json
{
  "error": "Internal server error",
  "details": "..."
}
```

---

## ✅ Frontend Integration

Once all API tests pass:
1. Go to `http://localhost:3001`
2. Fill in the form (name, age)
3. Click Submit
4. Check browser console for response

**Expected Console Output:**
```javascript
Response: {
  message: "User saved successfully",
  data: { name: "...", age: ... }
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to backend | Check if `node app.js` is running in backend folder |
| 404 on /api-docs | Make sure server has restarted after latest changes |
| Validation not working | Check backend terminal for error logs |
| Extra fields not ignored | Verify filterValidFields function is working |
| CORS error | Check if cors middleware is enabled in app.js |

---

## 📝 Current Configuration

**Entity:** User  
**Required Fields:**
- `name` (text)
- `age` (number)

**Validation Rules:**
- Both fields are required
- Empty strings and null values are rejected
- Unknown fields are silently ignored

---

**All tests should now pass! ✅**
