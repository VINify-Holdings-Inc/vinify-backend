import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MVM API",
      version: "1.0.0",
      description: "API documentation for the MVM",
      contact: {
        name: "techwagger.com",
        email: "connect@techwagger.com",
        url: "https://www.techwagger.com",
      },
    },
    servers: [
      {
        url: "https://mvmapi2.techwagger.com",
      }, 
      {
        url: "http://localhost:8000",
      } 
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/route/*.ts", "./src/docs/*.ts"], // Path to your API docs
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;
