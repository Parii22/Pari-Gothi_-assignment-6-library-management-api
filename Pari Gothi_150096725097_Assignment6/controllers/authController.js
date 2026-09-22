const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { db } = require("../config/firebaseConfig");


// ==================================================
// REGISTER STUDENT
// ==================================================

const registerStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = await db.collection("users").add({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      user: {
        id: userRef.id,
        name: name.trim(),
        email: normalizedEmail,
        role: "student"
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
};


// ==================================================
// REGISTER LIBRARIAN
// ==================================================

const registerLibrarian = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      secretKey
    } = req.body;

    if (!name || !email || !password || !secretKey) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and secretKey are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    if (secretKey !== process.env.LIBRARIAN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid librarian secret key"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = await db.collection("users").add({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "librarian",
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: "Librarian registered successfully",
      user: {
        id: userRef.id,
        name: name.trim(),
        email: normalizedEmail,
        role: "librarian"
      }
    });

  } catch (error) {
    console.error("Librarian Registration Error:", error);

    res.status(500).json({
      success: false,
      message: "Librarian registration failed"
    });
  }
};


// ==================================================
// LOGIN
// ==================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const snapshot = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: userDoc.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: userDoc.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};


// ==================================================
// GET PROFILE
// ==================================================

const getProfile = async (req, res) => {
  try {
    const userDoc = await db
      .collection("users")
      .doc(req.user.userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = userDoc.data();

    res.json({
      success: true,
      user: {
        id: userDoc.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile"
    });
  }
};


module.exports = {
  registerStudent,
  registerLibrarian,
  loginUser,
  getProfile
};