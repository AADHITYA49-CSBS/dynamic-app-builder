const express = require('express');
const router = express.Router();

const sampleConfig = {
  entity: "User",
  fields: [
    { name: "name", type: "text" },
    { name: "age", type: "number" }
  ]
};

router.get('/', (req, res) => {
  res.json(sampleConfig);
});

module.exports = router;