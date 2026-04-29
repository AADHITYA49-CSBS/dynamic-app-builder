-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  `schema` JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_forms_name (name)
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT NOT NULL,
  data JSON,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_form_id (form_id),
  CONSTRAINT fk_form_submissions_form
    FOREIGN KEY (form_id) REFERENCES forms(id)
    ON DELETE CASCADE
);

-- Seed one sample config used by /config and /api/:entity
INSERT INTO forms (name, `schema`)
VALUES (
  'User',
  JSON_OBJECT(
    'entity', 'User',
    'fields', JSON_ARRAY(
      JSON_OBJECT('name', 'name', 'type', 'text'),
      JSON_OBJECT('name', 'age', 'type', 'number'),
      JSON_OBJECT('name', 'email', 'type', 'email')
    )
  )
)
ON DUPLICATE KEY UPDATE `schema` = VALUES(`schema`);

