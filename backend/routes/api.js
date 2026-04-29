const express = require('express');
const router = express.Router();
const { query } = require('../db');

async function getFormConfig(entity) {
  const results = await query('SELECT id, name, `schema` FROM forms WHERE name = ? LIMIT 1', [entity]);

  if (results.length === 0) {
    return null;
  }

  const form = results[0];
  let parsed = null;

  try {
    parsed = typeof form.schema === 'object' ? form.schema : JSON.parse(form.schema);
  } catch (err) {
    console.error('Error parsing form schema:', err);
    parsed = null;
  }

  if (Array.isArray(parsed)) {
    parsed = { entity: form.name, fields: parsed };
  }

  if (!parsed || !Array.isArray(parsed.fields)) {
    return null;
  }

  return { id: form.id, entity: form.name, fields: parsed.fields };
}

const filterValidFields = (data, validFields) => {
  const fieldNames = validFields
    .map((field) => (field && typeof field.name === 'string' ? field.name.trim() : ''))
    .filter((name) => name !== '');
  const filteredData = {};

  fieldNames.forEach((fieldName) => {
    if (Object.prototype.hasOwnProperty.call(data, fieldName)) {
      filteredData[fieldName] = data[fieldName];
    }
  });

  return filteredData;
};

/**
 * @swagger
 * /api/{entity}:
 *   post:
 *     summary: Submit form data
 *     tags:
 *       - Data Submission
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Data saved successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Server error
 */
router.post('/:entity', async (req, res) => {
  try {
    const entity = req.params.entity;
    const data = req.body;

    // Validate entity
    if (!entity || typeof entity !== 'string' || entity.trim() === '') {
      return res.status(400).json({
        error: 'Entity name is required'
      });
    }

    // Validate request body
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        error: 'Request body cannot be empty'
      });
    }

    if (typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({
        error: 'Invalid payload. Request body must be a JSON object'
      });
    }

    const config = await getFormConfig(entity);
    if (!config) {
      return res.status(404).json({
        error: `Entity "${entity}" not found in database`
      });
    }

    const validatedData = filterValidFields(data, config.fields);

    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        error: 'Invalid payload. No valid fields found for this entity'
      });
    }

    const result = await query(
      'INSERT INTO form_submissions (form_id, data) VALUES (?, ?)',
      [config.id, JSON.stringify(validatedData)]
    );

    console.log(`[${new Date().toISOString()}] POST /api/${entity} - Submission saved (ID: ${result.insertId})`);

    res.status(201).json({
      message: `${entity} saved successfully`,
      data: validatedData,
      id: result.insertId
    });
  } catch (error) {
    console.error('Error processing POST request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/{entity}:
 *   get:
 *     summary: Fetch all submissions for an entity
 *     tags:
 *       - Data Retrieval
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of submissions
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Server error
 */
router.get('/:entity', async (req, res) => {
  try {
    const entity = req.params.entity;

    // Validate entity
    if (!entity || typeof entity !== 'string' || entity.trim() === '') {
      return res.status(400).json({
        error: 'Entity name is required'
      });
    }

    const config = await getFormConfig(entity);
    if (!config) {
      console.log(`[${new Date().toISOString()}] GET /api/${entity} - Entity not found`);
      return res.status(404).json({
        error: `Entity "${entity}" not found`,
      });
    }

    const rows = await query(
      `SELECT fs.id, fs.data, fs.submitted_at
       FROM form_submissions fs
       JOIN forms f ON fs.form_id = f.id
       WHERE f.name = ?
       ORDER BY fs.submitted_at DESC`,
      [entity]
    );

    const parsedSubmissions = rows.map((row) => {
      let parsedData = {};
      try {
        parsedData = typeof row.data === 'object' ? row.data : JSON.parse(row.data);
      } catch (err) {
        parsedData = {};
      }

      return {
        id: row.id,
        data: parsedData,
        submitted_at: row.submitted_at,
      };
    });

    console.log(`[${new Date().toISOString()}] GET /api/${entity} - Found ${parsedSubmissions.length} submissions`);

    res.json({
      entity,
      count: parsedSubmissions.length,
      data: parsedSubmissions
    });
  } catch (error) {
    console.error('Error processing GET request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
