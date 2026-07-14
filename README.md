# Members Only Clubhouse

A secure, full-stack, real-time message board application where users can write posts, but only authorized, verified "Club Members" can see who wrote each message and when. Anonymous users can sign up and read posts, but the authors remain a mystery until they enter the secret passcode!

## Live Demo

- **Frontend:** https://members-only-1-pdah.onrender.com
- **Backend API:** https://members-only-lq7b.onrender.com

## Tech Stack

**Frontend:**

- React + Vite
- Tailwind CSS

**Backend:**

- Node.js and Express
- Passport.js
- Express-Session
- Prisma ORM
- PostgreSQL

## Key Features

- **User Authentication:** Sign up and log in securely using hashed passwords (bcrypt) and persistent sessions.
- **Exclusive Authorization:** Non-members see message author information as "Anonymous" and timestamp information hidden.
- **Clubhouse Passcode Gate:** Enter the correct passcode to instantly upgrade database status (`isMember: true`) and reveal message details.
- **Cross-Origin Cookie Security:** Fully configured CORS and Cookie settings to securely transport session IDs across domains in production.

## Environment Variables

**Backend**:

- `PORT`: Local port for server to run on
- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_URL`: Frontend client domain
- `SESSION_SECRET`: Secret key used to encrypt cookie

**Frontend**:

- `VITE_API_URL`: URL of live/local backend API
