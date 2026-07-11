const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

// Pass down the prisma instance from app.js to not duplicate databse connection pools
module.exports = function (prisma) {
  // Define the Local Strategy (How Passport verifies user credentials)
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find the user in the database
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
          return done(null, false, {
            message: "Incorrect username or password.",
          });
        }

        // Check if the hashed password matches
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, {
            message: "Incorrect username or password.",
          });
        }

        // Credentials are completely correct, pass user along to serialize step
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  // Serialize User: Determines what user data to pack into the session cookie wrapper (just the ID)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize User: On future requests, grabs the ID from the session cookie and finds the user details from DB
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user); // Attaches full user object to req.user
    } catch (err) {
      done(err);
    }
  });
};
