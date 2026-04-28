const express = require('express');
const router = express.Router();

const sampleConfig = {
  entity: "User",
  fields: [
    { name: "name", type: "text" },
    { name: "age", type: "number" }
  ]
};

/**
 * @swagger
 * /config:
 *   get:
 *     summary: Get form configuration
 *     tags:
 *       - Configuration
 *     responses:
 *       200:
 *         description: Form configuration
 */
router.get('/', (req, res) => {
  res.json(sampleConfig);
});

module.exports = router;