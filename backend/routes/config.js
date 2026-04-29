const express = require('express');
const router = express.Router();
const { query } = require('../db');

const defaultConfig = {
  entity: 'User',
  fields: [
    { name: 'name', type: 'text' },
    { name: 'age', type: 'number' },
    { name: 'email', type: 'email' },
  ],
};

function parseStoredSchema(schemaValue) {
  if (!schemaValue) return null;

  if (typeof schemaValue === 'object') {
    return schemaValue;
  }

  try {
    const parsed = JSON.parse(schemaValue);
    if (Array.isArray(parsed)) {
      return { entity: defaultConfig.entity, fields: parsed };
    }
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (err) {
    console.error('Error parsing stored form schema:', err.message);
  }

  return null;
}

function normalizeConfig(entity, schemaValue) {
  const parsed = parseStoredSchema(schemaValue);

  if (!parsed) {
    return null;
  }

  const normalized = {
    entity: parsed.entity || entity,
    fields: Array.isArray(parsed.fields) ? parsed.fields : [],
  };

  return normalized;
}

async function ensureDefaultConfigExists() {
  const results = await query('SELECT id, `schema` FROM forms WHERE name = ? LIMIT 1', [defaultConfig.entity]);

  if (results.length === 0) {
    await query('INSERT INTO forms (name, `schema`) VALUES (?, ?)', [
      defaultConfig.entity,
      JSON.stringify(defaultConfig),
    ]);
    console.log('✓ Default config for "User" inserted into database');
    return;
  }

  const existing = parseStoredSchema(results[0].schema);
  if (!existing || !existing.entity || !Array.isArray(existing.fields)) {
    await query('UPDATE forms SET `schema` = ? WHERE name = ?', [
      JSON.stringify(defaultConfig),
      defaultConfig.entity,
    ]);
    console.log('✓ Default config for "User" normalized in database');
  }
}

router.get('/:entity', async (req, res) => {
  try {
    const entity = req.params.entity;

    if (!entity || typeof entity !== 'string' || entity.trim() === '') {
      return res.status(400).json({ error: 'Entity name is required' });
    }

    if (entity === 'User') {
      await ensureDefaultConfigExists();
    }

    const rows = await query('SELECT name, `schema` FROM forms WHERE name = ? LIMIT 1', [entity]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const parsed = normalizeConfig(entity, rows[0].schema);
    if (!parsed) {
      return res.status(500).json({ error: 'Invalid form schema stored in database' });
    }

    const rawSchema = typeof rows[0].schema === 'string' ? rows[0].schema : JSON.stringify(rows[0].schema);
    const normalizedSchema = JSON.stringify(parsed);
    if (rawSchema !== normalizedSchema) {
      await query('UPDATE forms SET `schema` = ? WHERE name = ?', [normalizedSchema, entity]);
      console.log(`✓ Normalized stored config for "${entity}"`);
    }

    res.json(parsed);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
