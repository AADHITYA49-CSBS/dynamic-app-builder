/**
 * Database Schema for Dynamic App Builder
 * Run this file to initialize the database structure
 *
 * Usage: mysql -u root -p dynamic_app_builder < schema.sql
 */

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  form_schema JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT NOT NULL,
  data JSON,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  INDEX idx_form_id (form_id),
  INDEX idx_submitted_at (submitted_at)
);

-- Insert sample form data
INSERT INTO forms (name, description, form_schema) VALUES
(
  'User Registration Form',
  'Basic user registration form with validation',
  JSON_OBJECT(
    'fields', JSON_ARRAY(
      JSON_OBJECT('id', 'name', 'label', 'Full Name', 'type', 'text', 'required', true),
      JSON_OBJECT('id', 'email', 'label', 'Email', 'type', 'email', 'required', true),
      JSON_OBJECT('id', 'password', 'label', 'Password', 'type', 'password', 'required', true)
    )
  )
);

