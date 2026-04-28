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
 *     description: Returns the dynamic form structure with fields
 *     tags:
 *       - Configuration
 *     responses:
 *       200:
 *         description: Successfully retrieved form configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entity:
 *                   type: string
 *                   example: User
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                   example:
 *                     - name: name
 *                       type: text
 *                     - name: age
 *                       type: number
 */
router.get('/', (req, res) => {
  res.json(sampleConfig);
});

module.exports = router;