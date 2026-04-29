const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * Get form config from database
 */
async function getFormConfig(entity) {
  try {
    const results = await query(
      'SELECT form_schema FROM forms WHERE name = ?',
      [entity]
    );

    if (results.length === 0) {
      return null;
    }

    const form = results[0];
    let fields = [];
    try {
      fields = JSON.parse(form.form_schema);
    } catch (err) {
      console.error('Error parsing form schema:', err);
      fields = [];
    }

    return { entity, fields };
  } catch (err) {
    console.error('Error fetching form config:', err);
    throw err;
  }
}

/**
 * Filter to only valid fields based on schema
 */
const filterValidFields = (data, validFields) => {
  const fieldNames = validFields.map(field => field.name).filter(name => name);
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

    // Get form config from database
    const config = await getFormConfig(entity);
    if (!config) {
      return res.status(404).json({
        error: `Entity "${entity}" not found in database`
      });
    }

    // Filter to only valid fields
    const validatedData = filterValidFields(data, config.fields);

    // Get form ID
    const formResults = await query(
      'SELECT id FROM forms WHERE name = ?',
      [entity]
    );

    if (formResults.length === 0) {
      return res.status(404).json({
        error: `Entity "${entity}" not found`
      });
    }

    const formId = formResults[0].id;

    // Insert into form_submissions
    const result = await query(
      'INSERT INTO form_submissions (form_id, data) VALUES (?, ?)',
      [formId, JSON.stringify(validatedData)]
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

    // Get form ID
    const formResults = await query(
      'SELECT id FROM forms WHERE name = ?',
      [entity]
    );

    if (formResults.length === 0) {
      console.log(`[${new Date().toISOString()}] GET /api/${entity} - Entity not found`);
      return res.status(404).json({
        error: `Entity "${entity}" not found`,
        data: []
      });
    }

    const formId = formResults[0].id;

    // Fetch all submissions
    const submissions = await query(
      'SELECT id, data, submitted_at FROM form_submissions WHERE form_id = ? ORDER BY submitted_at DESC',
      [formId]
    );

    // Parse JSON data
    const parsedSubmissions = submissions.map(submission => {
      let parsedData = {};
      try {
        parsedData = JSON.parse(submission.data);
      } catch (err) {
        console.error('Error parsing submission data:', err);
        parsedData = submission.data;
      }

      return {
        id: submission.id,
        ...parsedData,
        submitted_at: submission.submitted_at
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
