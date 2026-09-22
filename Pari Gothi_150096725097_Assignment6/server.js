require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const { db } = require("./config/firebaseConfig");
const swaggerSpec = require("./config/swagger");

const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");

const apiLimiter = require("./middleware/rateLimiter");

const app = express();

const PORT = process.env.PORT || 5050;


// ==================================================
// GLOBAL MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json());


// ==================================================
// BASIC TEST ROUTE
// ==================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Library Management API is running"
  });
});


// ==================================================
// SWAGGER DOCUMENTATION
// ==================================================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);


// ==================================================
// RATE LIMITING
// Applies to all /api/* routes
// ==================================================

app.use("/api", apiLimiter);


// ==================================================
// FIREBASE TEST ROUTE
// ==================================================

app.get("/test-firebase", async (req, res) => {
  try {
    const snapshot = await db
      .collection("books")
      .limit(1)
      .get();

    res.json({
      success: true,
      message: "Firebase connected successfully",
      documentsFound: snapshot.size
    });

  } catch (error) {
    console.error("Firebase Error:", error);

    res.status(500).json({
      success: false,
      message: "Firebase connection failed",
      error: error.message
    });
  }
});


// ==================================================
// ROUTES
// ==================================================

app.use("/api/auth", authRoutes);

app.use("/api", borrowRoutes);

app.use("/api/books", bookRoutes);


// ==================================================
// 404 HANDLER
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});


// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});


// ==================================================
// START SERVER
// ==================================================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});