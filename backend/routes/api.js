const express = require('express');
const router = express.Router();

// Get config data
const getConfig = () => {
  return {
    entity: "User",
    fields: [
      { name: "name", type: "text" },
      { name: "age", type: "number" }
    ]
  };
};

// Validate request body
const validateRequestBody = (data, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!(field.name in data) || data[field.name] === '' || data[field.name] === null) {
      missingFields.push(field.name);
    }
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required field: ${missingFields[0]}`
    };
  }

  return { isValid: true };
};

// Filter to only valid fields
const filterValidFields = (data, validFields) => {
  const fieldNames = validFields.map(field => field.name);
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
 *       500:
 *         description: Server error
 */
router.post('/:entity', (req, res) => {
  try {
    const entity = req.params.entity;
    const data = req.body;

    if (!entity || typeof entity !== 'string') {
      return res.status(400).json({
        error: 'Entity name is required'
      });
    }

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        error: 'Request body cannot be empty'
      });
    }

    const appConfig = getConfig();
    const requiredFields = appConfig.fields;

    const validation = validateRequestBody(data, requiredFields);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    const validatedData = filterValidFields(data, requiredFields);

    console.log(`[${new Date().toISOString()}] Received POST request for entity: ${entity}`);
    console.log('Validated Data:', validatedData);

    res.status(201).json({
      message: `${entity} saved successfully`,
      data: validatedData
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
