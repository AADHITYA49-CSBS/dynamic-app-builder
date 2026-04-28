const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dynamic Form API',
      version: '1.0.0',
      description: 'API for dynamic form configuration and data submission',
      contact: {
        name: 'API Support',
        url: 'http://localhost:5000',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
  },
  apis: [path.join(__dirname, './routes/*.js')],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
