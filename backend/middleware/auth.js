module.exports = {
  isLoggedIn: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // proceed to the route handler
    }
    return res
      .status(401)
      .json({ message: "You must be logged in to do that." });
  },
};
