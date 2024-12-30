import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MVM API',
      version: '1.0.0',
      description: 'API documentation for the MVM',
      contact: {
        name: 'Amit Chauhan', 
        email: 'amit.chauhan@techwagger.com',
        
      },
    },
    servers: [
      {
        url: 'http://localhost:4800', 
      },
      {
        url: 'https://mvmapi.techwagger.com', 
      },
    ],
  },
  apis: ['./src/route/*.ts', './src/docs/*.ts'],  
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;
