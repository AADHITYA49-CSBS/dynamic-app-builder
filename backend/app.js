const express = require('express');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const db = require('./db');
const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const configRoute = require('./routes/config');
const apiRoute = require('./routes/api');

app.use('/config', configRoute);
app.use('/api', apiRoute);

app.get('/', (req, res) => {
  res.send('Backend running - Visit http://localhost:5000/api-docs for API documentation');
});

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  
  // Test database connection
  const isConnected = await db.testConnection();
  if (!isConnected) {
    console.error('Failed to connect to database. Please check your .env configuration.');
    process.exit(1);
  }

  await db.ensureSchema();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await db.closePool();
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    await db.closePool();
    console.log('HTTP server closed');
    process.exit(0);
  });
});
