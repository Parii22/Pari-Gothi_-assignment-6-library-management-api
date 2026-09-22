const { db } = require("../config/firebaseConfig");


// ==================================================
// GET ALL BOOKS
// ==================================================

const getBooks = async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = db.collection("books");

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();

    let books = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    if (search) {
      const searchTerm = search.toLowerCase();

      books = books.filter((book) =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.isbn.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      count: books.length,
      books
    });

  } catch (error) {
    console.error("Get Books Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve books"
    });
  }
};


// ==================================================
// GET SINGLE BOOK
// ==================================================

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const bookDoc = await db
      .collection("books")
      .doc(id)
      .get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      book: {
        id: bookDoc.id,
        ...bookDoc.data()
      }
    });

  } catch (error) {
    console.error("Get Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve book"
    });
  }
};


// ==================================================
// ADD BOOK
// ==================================================

const addBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      totalCopies
    } = req.body;

    if (
      !title ||
      !author ||
      !isbn ||
      !category ||
      totalCopies === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, author, ISBN, category and totalCopies are required"
      });
    }

    if (!Number.isInteger(totalCopies) || totalCopies < 1) {
      return res.status(400).json({
        success: false,
        message: "totalCopies must be a positive integer"
      });
    }

    const existingBook = await db
      .collection("books")
      .where("isbn", "==", isbn)
      .limit(1)
      .get();

    if (!existingBook.empty) {
      return res.status(409).json({
        success: false,
        message: "A book with this ISBN already exists"
      });
    }

    const bookRef = await db.collection("books").add({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category: category.trim(),
      totalCopies,
      availableCopies: totalCopies,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      book: {
        id: bookRef.id,
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category: category.trim(),
        totalCopies,
        availableCopies: totalCopies
      }
    });

  } catch (error) {
    console.error("Add Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add book"
    });
  }
};


// ==================================================
// UPDATE BOOK
// ==================================================

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      author,
      isbn,
      category,
      totalCopies
    } = req.body;

    const bookRef = db.collection("books").doc(id);

    const bookDoc = await bookRef.get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    const currentBook = bookDoc.data();

    const updates = {};

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (author !== undefined) {
      updates.author = author.trim();
    }

    if (isbn !== undefined) {
      updates.isbn = isbn.trim();
    }

    if (category !== undefined) {
      updates.category = category.trim();
    }

    if (totalCopies !== undefined) {
      if (!Number.isInteger(totalCopies) || totalCopies < 0) {
        return res.status(400).json({
          success: false,
          message: "totalCopies must be a non-negative integer"
        });
      }

      const borrowedCopies =
        currentBook.totalCopies -
        currentBook.availableCopies;

      if (totalCopies < borrowedCopies) {
        return res.status(400).json({
          success: false,
          message:
            "totalCopies cannot be less than the number of borrowed copies"
        });
      }

      updates.totalCopies = totalCopies;
      updates.availableCopies =
        totalCopies - borrowedCopies;
    }

    updates.updatedAt = new Date().toISOString();

    await bookRef.update(updates);

    const updatedBook = await bookRef.get();

    res.json({
      success: true,
      message: "Book updated successfully",
      book: {
        id: updatedBook.id,
        ...updatedBook.data()
      }
    });

  } catch (error) {
    console.error("Update Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update book"
    });
  }
};


// ==================================================
// DELETE BOOK
// ==================================================

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const bookRef = db.collection("books").doc(id);

    const bookDoc = await bookRef.get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    const activeBorrows = await db
      .collection("borrow_records")
      .where("bookId", "==", id)
      .where("status", "==", "borrowed")
      .limit(1)
      .get();

    if (!activeBorrows.empty) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a book while copies are currently borrowed"
      });
    }

    await bookRef.delete();

    res.json({
      success: true,
      message: "Book deleted successfully"
    });

  } catch (error) {
    console.error("Delete Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete book"
    });
  }
};


module.exports = {
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook
};