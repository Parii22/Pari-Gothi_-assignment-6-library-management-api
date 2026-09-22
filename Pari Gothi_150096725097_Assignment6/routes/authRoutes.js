const express = require("express");

const {
  registerStudent,
  registerLibrarian,
  loginUser,
  getProfile
} = require("../controllers/authController");

const authenticate = require("../middleware/auth");

const router = express.Router();


// ==================================================
// REGISTER STUDENT
// ==================================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student registered successfully
 */
router.post("/register", registerStudent);


// ==================================================
// REGISTER LIBRARIAN
// ==================================================

/**
 * @swagger
 * /api/auth/register-librarian:
 *   post:
 *     summary: Register a librarian using the secret key
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - secretKey
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               secretKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Librarian registered successfully
 */
router.post(
  "/register-librarian",
  registerLibrarian
);


// ==================================================
// LOGIN
// ==================================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", loginUser);


// ==================================================
// PROFILE
// ==================================================

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/profile",
  authenticate,
  getProfile
);


module.exports = router;