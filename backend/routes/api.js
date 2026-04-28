const express = require('express');
const router = express.Router();

// Dynamic POST route for any entity
router.post('/:entity', (req, res) => {
  try {
    const entity = req.params.entity;
    const data = req.body;

    // Validate entity name
    if (!entity || typeof entity !== 'string') {
      return res.status(400).json({
        message: 'Invalid entity name',
        error: 'Entity name is required and must be a string'
      });
    }

    // Validate request body
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Invalid request body',
        error: 'Request body cannot be empty'
      });
    }

    // Log incoming data
    console.log(`[${new Date().toISOString()}] Received POST request for entity: ${entity}`);
    console.log('Data:', data);

    // Return success response
    res.status(201).json({
      message: `${entity} saved successfully`,
      data: data
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
