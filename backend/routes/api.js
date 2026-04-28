const express = require('express');
const router = express.Router();

// Import config for validation
const configRoute = require('./config');
const sampleConfig = require('./config');

// Get config data
let config = null;
const getConfig = () => {
  // In a real app, this would be fetched from a database
  // For now, we'll use the sample config
  return {
    entity: "User",
    fields: [
      { name: "name", type: "text" },
      { name: "age", type: "number" }
    ]
  };
};

// Helper function to validate request body against config fields
const validateRequestBody = (data, requiredFields) => {
  // Check if all required fields are present
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

// Helper function to filter data to only include valid fields
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

// Dynamic POST route for any entity
router.post('/:entity', (req, res) => {
  try {
    const entity = req.params.entity;
    const data = req.body;

    // Validate entity name
    if (!entity || typeof entity !== 'string') {
      return res.status(400).json({
        error: 'Entity name is required and must be a string'
      });
    }

    // Validate request body
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        error: 'Request body cannot be empty'
      });
    }

    // Get config for validation
    const appConfig = getConfig();
    const requiredFields = appConfig.fields;

    // Validate fields against config
    const validation = validateRequestBody(data, requiredFields);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // Filter data to only include valid fields (ignore unknown fields)
    const validatedData = filterValidFields(data, requiredFields);

    // Log incoming data
    console.log(`[${new Date().toISOString()}] Received POST request for entity: ${entity}`);
    console.log('Validated Data:', validatedData);

    // Return success response
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
