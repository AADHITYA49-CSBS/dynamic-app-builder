# Database Setup Guide

## Prerequisites
- MySQL Server running on localhost:3306
- MySQL credentials: root / Djaadhi_09

## Database Configuration

The database connection is configured via environment variables in `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Djaadhi_09
DB_NAME=dynamic_app_builder
```

## Creating the Database

### Option 1: Automatic (Recommended)
Run the following command to create the database and tables:

```bash
mysql -h localhost -u root -pDjaadhi_09 < backend/schema.sql
```

### Option 2: Manual using MySQL CLI
```bash
mysql -h localhost -u root -pDjaadhi_09

-- In MySQL shell:
CREATE DATABASE IF NOT EXISTS dynamic_app_builder;
USE dynamic_app_builder;
-- Then run the SQL from schema.sql
```

### Option 3: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL instance
3. Open File → Open SQL Script → Select `backend/schema.sql`
4. Execute the script

## Database Schema

### Tables

#### `forms`
Stores form configurations and metadata
- `id` (INT, PRIMARY KEY) - Auto-incrementing ID
- `name` (VARCHAR) - Form name
- `description` (TEXT) - Form description
- `form_schema` (JSON) - Form field definitions and layout
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### `form_submissions`
Stores user form submissions
- `id` (INT, PRIMARY KEY) - Auto-incrementing ID
- `form_id` (INT, FOREIGN KEY) - Reference to forms table
- `data` (JSON) - Submitted form data
- `submitted_at` (TIMESTAMP) - Submission timestamp

## Testing Connection

The backend automatically tests the database connection on startup:

```bash
cd backend
npm install
node app.js
```

You should see:
```
✓ Database connection successful
Server running on port 5000
Swagger UI available at http://localhost:5000/api-docs
```

## Using Database in Routes

```javascript
const { query } = require('../db');

// Get all forms
async function getAllForms() {
  try {
    const forms = await query('SELECT * FROM forms');
    return forms;
  } catch (error) {
    console.error('Error fetching forms:', error);
    throw error;
  }
}

// Create a new form
async function createForm(name, description, formSchema) {
  try {
    const result = await query(
      'INSERT INTO forms (name, description, form_schema) VALUES (?, ?, ?)',
      [name, description, JSON.stringify(formSchema)]
    );
    return result;
  } catch (error) {
    console.error('Error creating form:', error);
    throw error;
  }
}

// Get form by ID
async function getFormById(formId) {
  try {
    const [form] = await query('SELECT * FROM forms WHERE id = ?', [formId]);
    return form;
  } catch (error) {
    console.error('Error fetching form:', error);
    throw error;
  }
}
```

## Troubleshooting

### Error: "Unknown database 'dynamic_app_builder'"
- Make sure you've created the database first using schema.sql

### Error: "Connection refused"
- Verify MySQL server is running
- Check host, port, and credentials in .env

### Error: "Access denied for user 'root'"
- Verify password in .env matches your MySQL root password
- Try connecting manually: `mysql -h localhost -u root -p`

## Backup & Restore

### Backup database
```bash
mysqldump -h localhost -u root -pDjaadhi_09 dynamic_app_builder > backup.sql
```

### Restore database
```bash
mysql -h localhost -u root -pDjaadhi_09 dynamic_app_builder < backup.sql
```

