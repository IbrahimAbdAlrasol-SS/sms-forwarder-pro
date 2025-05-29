const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SMS Forwarder API',
      version: '1.0.0',
      description: 'API لنظام إعادة توجيه الرسائل القصيرة',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'خادم التطوير المحلي',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // مسارات ملفات التوثيق
};

module.exports = swaggerJsdoc(options);