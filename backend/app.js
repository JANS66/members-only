const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config();

const prisma = new PrismaClient();
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
