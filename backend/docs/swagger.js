
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Skills Management API',
      version: '1.0.0',
      description: 'API documentation for the Skills Management project',
    },
  },
  apis: [
    './routes/*.js', // Route für Doku-Kommentare
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerSpec, swaggerUi };
