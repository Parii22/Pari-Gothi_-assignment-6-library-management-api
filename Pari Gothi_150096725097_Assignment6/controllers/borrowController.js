const { db } = require("../config/firebaseConfig");


// ==================================================
// BORROW BOOK
// ==================================================

const borrowBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const bookRef = db.collection("books").doc(id);

    const borrowRef = db.collection("borrow_records").doc();

    const now = new Date();

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 14);

    await db.runTransaction(async (transaction) => {

      // Get book inside transaction
      const bookDoc = await transaction.get(bookRef);

      if (!bookDoc.exists) {
        throw new Error("BOOK_NOT_FOUND");
      }

      const book = bookDoc.data();

      // Check availability
      if (book.availableCopies <= 0) {
        throw new Error("NO_COPIES_AVAILABLE");
      }

      // Check if student already has this book
      const existingBorrow = await db
        .collection("borrow_records")
        .where("userId", "==", userId)
        .where("bookId", "==", id)
        .where("status", "==", "borrowed")
        .limit(1)
        .get();

      if (!existingBorrow.empty) {
        throw new Error("ALREADY_BORROWED");
      }

      // Decrease available copies
      transaction.update(bookRef, {
        availableCopies: book.availableCopies - 1
      });

      // Create borrow record
      transaction.set(borrowRef, {
        userId,
        bookId: id,
        bookTitle: book.title,
        borrowDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        returnDate: null,
        status: "borrowed"
      });
    });

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      borrowRecord: {
        id: borrowRef.id,
        bookId: id,
        borrowDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        status: "borrowed"
      }
    });

  } catch (error) {
    console.error("Borrow Error:", error);

    if (error.message === "BOOK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    if (error.message === "NO_COPIES_AVAILABLE") {
      return res.status(400).json({
        success: false,
        message: "No copies of this book are currently available"
      });
    }

    if (error.message === "ALREADY_BORROWED") {
      return res.status(400).json({
        success: false,
        message: "You already have this book borrowed"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to borrow book"
    });
  }
};


// ==================================================
// RETURN BOOK
// ==================================================

const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const activeBorrowSnapshot = await db
      .collection("borrow_records")
      .where("userId", "==", userId)
      .where("bookId", "==", id)
      .where("status", "==", "borrowed")
      .limit(1)
      .get();

    if (activeBorrowSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No active borrowing record found for this book"
      });
    }

    const borrowDoc = activeBorrowSnapshot.docs[0];

    const borrowRef = db
      .collection("borrow_records")
      .doc(borrowDoc.id);

    const bookRef = db
      .collection("books")
      .doc(id);

    const returnDate = new Date().toISOString();

    await db.runTransaction(async (transaction) => {

      const bookDoc = await transaction.get(bookRef);
      const currentBorrowDoc = await transaction.get(borrowRef);

      if (!bookDoc.exists) {
        throw new Error("BOOK_NOT_FOUND");
      }

      if (!currentBorrowDoc.exists) {
        throw new Error("BORROW_RECORD_NOT_FOUND");
      }

      const book = bookDoc.data();
      const borrow = currentBorrowDoc.data();

      if (borrow.status !== "borrowed") {
        throw new Error("ALREADY_RETURNED");
      }

      const newAvailableCopies =
        Math.min(
          book.availableCopies + 1,
          book.totalCopies
        );

      transaction.update(bookRef, {
        availableCopies: newAvailableCopies
      });

      transaction.update(borrowRef, {
        returnDate,
        status: "returned"
      });
    });

    res.json({
      success: true,
      message: "Book returned successfully",
      returnDate
    });

  } catch (error) {
    console.error("Return Error:", error);

    if (error.message === "BOOK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    if (error.message === "ALREADY_RETURNED") {
      return res.status(400).json({
        success: false,
        message: "This book has already been returned"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to return book"
    });
  }
};


// ==================================================
// MY BORROWING HISTORY
// ==================================================

const getMyHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const snapshot = await db
      .collection("borrow_records")
      .where("userId", "==", userId)
      .get();

    const records = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort(
        (a, b) =>
          new Date(b.borrowDate) -
          new Date(a.borrowDate)
      );

    res.json({
      success: true,
      count: records.length,
      records
    });

  } catch (error) {
    console.error("History Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve borrowing history"
    });
  }
};


// ==================================================
// LIBRARIAN - ALL BORROW RECORDS
// ==================================================

const getAllBorrowRecords = async (req, res) => {
  try {
    const snapshot = await db
      .collection("borrow_records")
      .get();

    const records = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort(
        (a, b) =>
          new Date(b.borrowDate) -
          new Date(a.borrowDate)
      );

    res.json({
      success: true,
      count: records.length,
      records
    });

  } catch (error) {
    console.error("Borrow Records Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve borrow records"
    });
  }
};


// ==================================================
// LIBRARIAN - OVERDUE REPORT
// ==================================================

const getOverdueBooks = async (req, res) => {
  try {
    const now = new Date();

    const snapshot = await db
      .collection("borrow_records")
      .where("status", "==", "borrowed")
      .get();

    const overdueRecords = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(
        (record) =>
          new Date(record.dueDate) < now
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate) -
          new Date(b.dueDate)
      );

    res.json({
      success: true,
      count: overdueRecords.length,
      records: overdueRecords
    });

  } catch (error) {
    console.error("Overdue Report Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve overdue report"
    });
  }
};


module.exports = {
  borrowBook,
  returnBook,
  getMyHistory,
  getAllBorrowRecords,
  getOverdueBooks
};