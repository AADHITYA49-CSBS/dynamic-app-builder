const express = require('express');
const router = express.Router();
const { query, ensureEntityTable, insertEntityRow, fetchEntityRows } = require('../db');

/**
 * Get form config from database
 */
async function getFormConfig(entity) {
  try {
    const results = await query('SELECT id, name, `schema` FROM forms WHERE name = ?', [entity]);

    if (results.length === 0) {
      return null;
    }

    const form = results[0];
    let fields = [];
    try {
      if (Array.isArray(form.schema)) {
        fields = form.schema;
      } else {
        const parsed = JSON.parse(form.schema);
        if (Array.isArray(parsed)) {
          fields = parsed;
        } else if (parsed && Array.isArray(parsed.fields)) {
          fields = parsed.fields;
        } else {
          fields = [];
        }
      }
    } catch (err) {
      console.error('Error parsing form schema:', err);
      fields = [];
    }

    return { id: form.id, entity: form.name, fields };
  } catch (err) {
    console.error('Error fetching form config:', err);
    throw err;
  }
}

/**
 * Filter to only valid fields based on schema
 */
const filterValidFields = (data, validFields) => {
  const fieldNames = validFields
    .map((field) => (field && typeof field.name === 'string' ? field.name.trim() : ''))
    .filter((name) => name !== '');
  const filteredData = {};
  
  fieldNames.forEach(fieldName => {
    if (fieldName in data) {
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

    // Get form config from database
    const config = await getFormConfig(entity);
    if (!config) {
      return res.status(404).json({
        error: `Entity "${entity}" not found in database`
      });
    }

    // Filter to only valid fields
    const validatedData = filterValidFields(data, config.fields);

    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        error: 'Invalid payload. No valid fields found for this entity'
      });
    }

    // Ensure entity table exists and migrate schema if needed
    await ensureEntityTable(entity, config.fields);

    // Insert into the dynamic entity table
    const result = await insertEntityRow(entity, validatedData, config.fields);

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
        data: []
      });
    }

    // Fetch rows from dynamic entity table. Returns [] if table missing
    const rows = await fetchEntityRows(entity);

    // rows are already in object form; return them directly
    const parsedSubmissions = rows.map(r => ({ ...r }));

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
