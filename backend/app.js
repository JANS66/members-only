require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Database setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();

// Global Core Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // For passing session cookies back and forth
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session Middleware configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Cookie expires in 1 day
      secure: false, // Set to true when running over HTTPS in production
      httpOnly: true, // Blocks client side JS from reading the cookie
    },
  }),
);

// Initialize Passport and link it to the Session middleware
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport")(prisma); // Registers strategies and passes prisma instance

// Mount API Routes
const apiRoutes = require("./routes/api")(prisma);
app.use("/api", apiRoutes); // Automatically adds /api prefix to all sub routes

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend API running on http://localhost:${PORT}`),
);
