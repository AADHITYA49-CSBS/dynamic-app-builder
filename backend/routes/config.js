const express = require('express');
const router = express.Router();
const { pool, query } = require('../db');

const sampleConfig = {
  entity: "User",
  fields: [
    { name: "name", type: "text" },
    { name: "age", type: "number" },
    { name: "email", type: "email" }
  ]
};

/**
 * Ensure the config exists in the database
 */
async function ensureConfigExists() {
  try {
    const results = await query(
      'SELECT id FROM forms WHERE name = ?',
      [sampleConfig.entity]
    );

    if (results.length === 0) {
      await query(
        'INSERT INTO forms (name, description, form_schema) VALUES (?, ?, ?)',
        [
          sampleConfig.entity,
          `${sampleConfig.entity} form`,
          JSON.stringify(sampleConfig.fields)
        ]
      );
      console.log(`✓ Config for "${sampleConfig.entity}" inserted into database`);
    }
  } catch (err) {
    console.error('Error ensuring config exists:', err.message);
  }
}

/**
 * @swagger
 * /config:
 *   get:
 *     summary: Get form configuration
 *     tags:
 *       - Configuration
 *     responses:
 *       200:
 *         description: Form configuration with entity and fields
 */
router.get('/', async (req, res) => {
  try {
    // Ensure config exists in DB
    await ensureConfigExists();
    
    res.json(sampleConfig);
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({
      error: 'Failed to fetch configuration',
      details: err.message
    });
  }
});

module.exports = router;