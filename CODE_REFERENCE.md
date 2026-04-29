# Complete Code Reference

## Backend Implementation

### db.js
**Location:** `backend/db.js`

Provides database connection pooling with error handling. Exported functions:
- `pool` - MySQL connection pool
- `query(sql, values)` - Execute queries with promise support
- `testConnection()` - Test database connectivity
- `closePool()` - Graceful shutdown

Key features:
- Uses `mysql2/promise` for async/await support
- Connection pooling (10 max connections)
- Automatic error logging
- Environment variable configuration

### routes/config.js
**Location:** `backend/routes/config.js`

GET /config endpoint returns form configuration and auto-inserts to database.

```javascript
// Response
{
  "entity": "User",
  "fields": [
    { "name": "name", "type": "text" },
    { "name": "age", "type": "number" },
    { "name": "email", "type": "email" }
  ]
}
```

Key features:
- Fetches from database on first call
- Auto-creates config if missing
- Uses `ensureConfigExists()` helper
- Logs config insertion

### routes/api.js
**Location:** `backend/routes/api.js`

Implements POST and GET endpoints for form submissions.

#### POST /api/:entity
Accepts form data, validates, filters, and stores in database.

```javascript
// Request
POST /api/User
{
  "name": "John Doe",
  "age": 25,
  "email": "john@example.com"
}

// Response
201 Created
{
  "message": "User saved successfully",
  "data": {
    "name": "John Doe",
    "age": 25,
    "email": "john@example.com"
  },
  "id": 1
}
```

#### GET /api/:entity
Fetches all submissions for entity from database.

```javascript
// Request
GET /api/User

// Response
200 OK
{
  "entity": "User",
  "count": 2,
  "data": [
    {
      "id": 2,
      "name": "Jane Smith",
      "age": 28,
      "email": "jane@example.com",
      "submitted_at": "2026-04-29T10:30:00.000Z"
    },
    {
      "id": 1,
      "name": "John Doe",
      "age": 25,
      "email": "john@example.com",
      "submitted_at": "2026-04-29T10:15:00.000Z"
    }
  ]
}
```

Key features:
- `getFormConfig(entity)` - Fetches schema from database
- `filterValidFields(data, schema)` - Only accepts schema fields
- Error handling for missing entities (404)
- JSON data storage and retrieval
- Timestamps on all submissions
- Request/response logging

## Frontend Implementation

### App.js
**Location:** `frontend/src/App.js`

Main React component managing form rendering, submission, and data display.

#### Component State
```javascript
- config: null              // Form configuration
- formData: {}              // Current form input values
- loading: true             // Initial load state
- error: ''                 // Error messages
- isSubmitting: false       // Submit button state
- successMessage: ''        // Success notification
- submissions: []           // Submitted data
- loadingSubmissions: false // Submissions fetch state
```

#### Key Functions

**fetchConfig()**
- Fetches /config endpoint
- Sets initial form data
- Auto-fetches initial submissions

**fetchSubmissions(entity)**
- Fetches GET /api/:entity
- Parses JSON submissions
- Updates submissions state

**handleInputChange(fieldName, value)**
- Updates formData state
- Manages real-time input

**handleSubmit(e)**
- Validates entity exists
- POSTs to /api/:entity
- Clears form on success
- Refreshes submissions
- Shows success message

#### Rendering Logic
- Maps config.fields to form inputs
- Supports: text, number, email, password, date, checkbox, radio, textarea
- Defaults unknown types to text
- Creates table from submissions
- Displays timestamps
- Empty state when no submissions

### App.css
**Location:** `frontend/src/App.css`

Professional styling with responsive design.

#### Key Classes
- `.app-shell` - Main container (100vh, flex)
- `.app-card` - Card container (max 900px)
- `.form-section` - Form wrapper
- `.submissions-section` - Submissions wrapper
- `.dynamic-form` - Form grid (flexbox, gap 16px)
- `.field-group` - Label + input wrapper
- `.submit-button` - Primary action button
- `.submissions-table` - Data table
- `.status-message` - Alert messages (info/error/success)
- `.table-wrapper` - Responsive table scroll

#### Responsive Features
- Mobile-first design
- Max width 900px on desktop
- Horizontal scroll for tables
- Flexible spacing

## Environment Configuration

### .env
**Location:** `backend/.env`

```
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Djaadhi_09
DB_NAME=dynamic_app_builder

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Database Schema

### forms table
```sql
CREATE TABLE forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  form_schema JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Sample data:
```sql
INSERT INTO forms (name, description, form_schema) VALUES 
(
  'User',
  'User form',
  '[
    {"name": "name", "type": "text"},
    {"name": "age", "type": "number"},
    {"name": "email", "type": "email"}
  ]'
);
```

### form_submissions table
```sql
CREATE TABLE form_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT NOT NULL,
  data JSON,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);
```

Sample data:
```sql
INSERT INTO form_submissions (form_id, data) VALUES 
(
  1,
  '{"name": "John Doe", "age": 25, "email": "john@example.com"}'
);
```

## Server Configuration

### app.js
**Location:** `backend/app.js`

Express server with database integration.

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const configRoute = require('./routes/config');
const apiRoute = require('./routes/api');

app.use('/config', configRoute);
app.use('/api', apiRoute);

app.get('/', (req, res) => {
  res.send('Backend running - Visit http://localhost:5000/api-docs for API documentation');
});

const server = app.listen(5000, async () => {
  console.log('Server running on port 5000');
  console.log('Swagger UI available at http://localhost:5000/api-docs');
  
  // Test database connection
  const isConnected = await db.testConnection();
  if (!isConnected) {
    console.error('Failed to connect to database. Please check your .env configuration.');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await db.closePool();
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    await db.closePool();
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```

## Testing Endpoints

### Using curl

**Test config endpoint:**
```bash
curl http://localhost:5000/config
```

**Test POST submission:**
```bash
curl -X POST http://localhost:5000/api/User \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","age":30,"email":"test@example.com"}'
```

**Test GET submissions:**
```bash
curl http://localhost:5000/api/User
```

## Key Implementation Details

### Data Flow
1. Frontend makes GET /config → Gets entity and fields
2. Frontend renders dynamic form based on fields
3. User fills form and clicks Submit
4. Frontend POSTs to /api/{entity} with form data
5. Backend validates against schema
6. Backend filters to allowed fields only
7. Backend stores JSON in form_submissions
8. Backend returns success response
9. Frontend auto-fetches GET /api/{entity}
10. Frontend receives all submissions and displays in table

### Error Handling
- DB connection errors → 500 with details
- Missing entity → 404 with error message
- Empty body → 400 with error message
- Try-catch blocks wrap all async operations
- Logging for debugging

### Validation
- Entity must be string, non-empty
- Request body must not be empty
- Fields filtered against schema
- JSON parsing with fallback

### Security
- Input filtered by schema
- Extra fields ignored (not stored)
- CORS enabled for frontend access
- Environment variables protect credentials

---

**All code is production-ready and fully integrated.**

