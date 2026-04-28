const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const configRoute = require('./routes/config');
const apiRoute = require('./routes/api');

app.use('/config', configRoute);
app.use('/', apiRoute);

app.get('/', (req, res) => {
  res.send('Backend running - Visit http://localhost:5000/api-docs for API documentation');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
  console.log('Swagger UI available at http://localhost:5000/api-docs');
});