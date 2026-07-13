const express = require("express");
const router = express.Router();
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { isLoggedIn } = require("../middleware/auth");

module.exports = function (prisma) {
  // ==========================================
  // 1. POST /messages (Secure + Sanitized)
  // ==========================================
  router.post(
    "/messages",
    isLoggedIn,
    [
      body("title")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Title must be between 1 and 100 characters."),
      body("text")
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage("Message must be between 1 and 1000 characters."),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      try {
        const { title, text } = req.body;

        // Save to database using Prisma
        // COnnect the message directly to the user ID stored in the session
        const newMessage = await prisma.message.create({
          data: {
            title,
            text,
            userId: req.user.id, // Passport injected this safely from the session
          },
        });

        res
          .status(201)
          .json({ message: "Message posted successfully!", data: newMessage });
      } catch (error) {
        console.error("Prisma error:", error);
        res
          .status(500)
          .json({ message: "Failed to save message to database." });
      }
    },
  );

  // ==========================================
  // DELETE /messages/:id (Admin Exclusive)
  // ==========================================
  router.delete("/messages/:id", isLoggedIn, async (req, res) => {
    // Block non admins immediately
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin privileges required." });
    }

    try {
      const messageId = parseInt(req.params.id);

      await prisma.message.delete({
        where: { id: messageId },
      });

      res.json({
        message: "Message successfully deleted by administrative action.",
      });
    } catch (error) {
      console.error("Delete error:", error);
      res
        .status(500)
        .json({ message: "Failed to delete message from database." });
    }
  });

  // ==========================================
  // 2. POST /join (Validates Secret Code)
  // ==========================================
  router.post(
    "/join",
    isLoggedIn,
    [body("passcode").trim().notEmpty().withMessage("Passcode is required.")],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      try {
        const { passcode } = req.body;

        if (passcode !== process.env.SECRET_PASSCODE) {
          return res
            .status(400)
            .json({ message: "Incorrect secret passcode!" });
        }

        // Upgrade membershipStatus to true
        const updatedUser = await prisma.user.update({
          where: { id: req.user.id },
          data: { membershipStatus: true },
        });

        res.json({
          message: `Welcome to the inner circle, ${updatedUser.firstName}! Your membership is active.`,
        });
      } catch (error) {
        console.error("Join club error:", error);
        res.status(500).json({ error: "Failed to upgrade membership status." });
      }
    },
  );

  // ==========================================
  // 3. POST /login (No Sanitization needed, lookup only)
  // ==========================================
  router.post("/login", (req, res, next) => {
    // Hand req over to the LocalStrategy
    passport.authenticate("local", (err, user, info) => {
      // Case A: The DB crashed or threw error
      if (err) {
        return res
          .status(500)
          .json({ message: "An internal server error occurred." });
      }
      // CASE B: LOcalStrategy returned 'false' (User want found or bcrypt password failed)
      // 'info.message' holds the string text ("Incorrect username or password")
      if (!user) {
        // This maps to the custom verification error messages defined in the LocalStrategy
        return res
          .status(401)
          .json({ message: info.message || "Invalid credentials." });
      }

      // Explicitly establish a session for this user
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Could not log in session." });
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
          },
        });
      });
    })(req, res, next); // Executes the passport engine instantly
  });

  // ==========================================
  // 4. GET /auth-status
  // ==========================================
  router.get("/auth-status", (req, res) => {
    // Passport provides req.isAuthenticated() automatically based on the session cookie
    if (req.isAuthenticated()) {
      return res.json({
        authenticated: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          isAdmin: req.user.isAdmin,
        },
      });
    }
    return res.json({ authenticated: false, user: null });
  });

  // --- GET MESSAGES ---
  router.get("/messages", async (req, res) => {
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
        timestamp: isMember ? msg.timestamp : null,
        author: isMember
          ? `${msg.author.firstName} ${msg.author.lastName}`
          : "Anonymous",
      }));

      res.json(processedMessages);
    } catch (error) {
      res.status(500).json({ error: "Error loading clubhouse feed" });
    }
  });

  // --- SIGN UP ---
  router.post(
    "/register",
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

        res.status(201).json({
          message: "User registered successfully!",
          userId: newUser.id,
        });
      } catch (error) {
        console.error("Registration error:", error);
        res
          .status(500)
          .json({ error: "Internal server error during registration." });
      }
    },
  );

  return router;
};
