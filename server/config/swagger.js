/**
 * Swagger/OpenAPI Configuration
 * Generates interactive API documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NexaSphere API',
      version: '1.0.0',
      description:
        'Real-time event management platform with live updates, notifications, and team collaboration.',
      contact: {
        name: 'NexaSphere Team',
        email: 'support@nexasphere.com',
        url: 'https://nexasphere.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.nexasphere.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key for service-to-service authentication',
        },
      },
      schemas: {
        Event: {
          type: 'object',
          required: ['name', 'date', 'location'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Event unique identifier',
            },
            name: {
              type: 'string',
              description: 'Event name',
              example: 'Tech Workshop 2024',
            },
            description: {
              type: 'string',
              description: 'Event description',
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Event date and time',
              example: '2024-06-15T10:00:00Z',
            },
            location: {
              type: 'string',
              description: 'Event location',
              example: 'Building A, Room 101',
            },
            capacity: {
              type: 'integer',
              minimum: 1,
              description: 'Maximum attendees',
              example: 50,
            },
            registrations: {
              type: 'integer',
              description: 'Current registration count',
              example: 25,
            },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
              description: 'Event status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Event creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Event last update timestamp',
            },
          },
        },
        User: {
          type: 'object',
          required: ['email', 'name'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'organizer'],
              default: 'user',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            statusCode: {
              type: 'integer',
              example: 400,
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server/routes/*.js', './server/swagger-docs/*.js'],
};

const specs = swaggerJsdoc(options);

export default specs;
