const express = require("express");

const {
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook
} = require("../controllers/bookController");

const authenticate = require("../middleware/auth");

const {
  verifyLibrarian
} = require("../middleware/checkRole");

const router = express.Router();


// ==================================================
// GET ALL BOOKS
// ==================================================

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Browse the library catalog
 *     tags:
 *       - Books
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, author or ISBN
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of books
 */
router.get("/", getBooks);


// ==================================================
// GET SINGLE BOOK
// ==================================================

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get a single book
 *     tags:
 *       - Books
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         description: Book not found
 */
router.get("/:id", getBookById);


// ==================================================
// ADD BOOK
// ==================================================

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Add a new book
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - isbn
 *               - category
 *               - totalCopies
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               isbn:
 *                 type: string
 *               category:
 *                 type: string
 *               totalCopies:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Book created
 *       403:
 *         description: Librarian access required
 */
router.post(
  "/",
  authenticate,
  verifyLibrarian,
  addBook
);


// ==================================================
// UPDATE BOOK
// ==================================================

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update book details
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book updated
 */
router.put(
  "/:id",
  authenticate,
  verifyLibrarian,
  updateBook
);


// ==================================================
// DELETE BOOK
// ==================================================

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags:
 *       - Books
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted
 */
router.delete(
  "/:id",
  authenticate,
  verifyLibrarian,
  deleteBook
);


module.exports = router;