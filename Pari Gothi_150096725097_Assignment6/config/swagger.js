const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Library Management API",
      version: "1.0.0",
      description:
        "RESTful Library Management API using Node.js, Express, Firebase Firestore, JWT, bcrypt, rate limiting and Swagger."
    },

    servers: [
      {
        url: "http://localhost:5050",
        description: "Local development server"
      }
    ],

    tags: [
      {
        name: "Authentication",
        description: "User registration and authentication"
      },
      {
        name: "Books",
        description: "Library book catalog and inventory"
      },
      {
        name: "Borrowing",
        description: "Book borrowing, returning and history"
      },
      {
        name: "Librarian",
        description: "Librarian-only reports"
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },

      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            name: {
              type: "string"
            },
            email: {
              type: "string"
            },
            role: {
              type: "string",
              enum: ["student", "librarian"]
            }
          }
        },

        Book: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            title: {
              type: "string"
            },
            author: {
              type: "string"
            },
            isbn: {
              type: "string"
            },
            category: {
              type: "string"
            },
            totalCopies: {
              type: "integer"
            },
            availableCopies: {
              type: "integer"
            },
            createdAt: {
              type: "string"
            },
            updatedAt: {
              type: "string"
            }
          }
        },

        BorrowRecord: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            userId: {
              type: "string"
            },
            bookId: {
              type: "string"
            },
            bookTitle: {
              type: "string"
            },
            borrowDate: {
              type: "string"
            },
            dueDate: {
              type: "string"
            },
            returnDate: {
              type: "string",
              nullable: true
            },
            status: {
              type: "string",
              enum: ["borrowed", "returned"]
            }
          }
        }
      }
    }
  },

  apis: ["./routes/*.js"]
};

module.exports = swaggerJsdoc(options);