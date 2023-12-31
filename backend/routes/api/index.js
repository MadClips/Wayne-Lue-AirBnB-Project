// backend/routes/api/index.js
const router = require("express").Router();
const sessionRouter = require(`./session.js`);
const usersRouter = require(`./user.js`);
const spotsRouter = require(`./spot.js`);
const reviewsRouter = require(`./review.js`);
const spotImagesRouter = require(`./spotImage.js`);
const reviewImagesRouter = require(`./reviewImage.js`);
const bookingsRouter = require(`./booking.js`);
const { restoreUser } = require("../../utils/auth.js");

// Connect restoreUser middleware to the API router
// If current user session is valid, set req.user to the user in the database
// If current user session is not valid, set req.user to null

router.use(restoreUser);

router.use(`/session`, sessionRouter);

router.use(`/users`, usersRouter);

router.use(`/spots`, spotsRouter);

router.use(`/reviews`, reviewsRouter);

router.use(`/spot-images`, spotImagesRouter);

router.use(`/review-images`, reviewImagesRouter);

router.use(`/bookings`, bookingsRouter);

router.post(`/test`, (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;
