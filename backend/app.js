const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // For passing session cookies back and forth
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// --- API ROUTES ---

// 1. Get Feed
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      include: { author: true },
      orderBy: { timestamp: "desc" },
    });

    // Check if the user is a logged in clubhouse member
    const isMember = req.user && req.user.membershipStatus;

    // Map through messages: if not a member, strip the author details
    const processedMessages = messages.map((msg) => ({
      id: msg.id,
      title: msg.title,
      text: msg.text,
      timestamp: msg.timestamp,
      author: isMember
        ? `${msg.author.firstName} ${msg.author.lastName}`
        : "Anonymous",
    }));

    res.json(processedMessages);
  } catch (error) {
    res.status(500).json({ error: "Error loading clubhouse feed" });
  }
});

// --- SIGN UP / REGISTRATION ROUTE ---
app.post(
  "/api/register",
  [
    // 1. Sanitize and Validate inputs
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required.")
      .escape(),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required.")
      .escape(),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required.")
      .isAlphanumeric()
      .withMessage("Username must be alphanumeric.")
      .escape()
      .custom(async (value) => {
        // Check if username already exists in PostgreSQL
        const user = await prisma.user.findUnique({
          where: { username: value },
        });
        if (user) {
          throw new Error("Username is already taken.");
        }
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // If validations fail, return the array of errors to React
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // 2. Securely hash the password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // 3. Save User into the Database
      const newUser = await prisma.user.create({
        data: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          username: req.body.username,
          password: hashedPassword,
          membershipStatus: false, // Default to regular user until they join the club
        },
      });

      res
        .status(201)
        .json({ message: "User registered successfully!", userId: newUser.id });
    } catch (error) {
      console.error("Registration error:", error);
      res
        .status(500)
        .json({ error: "Internal server error during registration." });
    }
  },
);

// --- JOIN THE CLUB / UPGRADE STATUS ROUTE ---
app.post("/api/join", async (req, res) => {
  const { username, passcode } = req.body;

  if (!username || !passcode) {
    return res
      .status(400)
      .json({ error: "Username and passcode are required." });
  }

  if (passcode !== process.env.SECRET_PASSCODE) {
    return res.status(400).json({ error: "Incorrect passcode." });
  }

  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Upgrade membershipStatus to true
    const updatedUser = await prisma.user.update({
      where: { username },
      data: { membershipStatus: true },
    });

    res.json({
      message: `Welcome to the inner circle, ${updatedUser.firstName}! Your membership is active.`,
      membershipStatus: true,
    });
  } catch (error) {
    console.error("Join club error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// 2. Auth Status Check (React needs this to know if a user is logged in)
app.get("/api/auth-status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      loggedIn: true,
      user: {
        username: req.user.username,
        isMember: req.user.membershipStatus,
      },
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend API running on http://localhost:${PORT}`),
);
