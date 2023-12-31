const express = require(`express`);

const { requireAuth } = require(`../../utils/auth`);

const {
  Spot,
  SpotImage,
  Review,
  User,
  ReviewImage,
  Booking,
  Sequelize,
} = require(`../../db/models`);

const { check } = require(`express-validator`);
const { handleValidationErrors } = require(`../../utils/validation`);

const router = express.Router();

//* GET SPOTS BY CURRENT USER

router.get(`/current`, requireAuth, async (req, res, _next) => {
  const userId = req.user.dataValues.id;
  const spots = await Spot.findAll({
    where: { ownerId: userId },
    include: [{ model: Review }, { model: SpotImage }],
  });
  let listOfSpots = [];

  spots.forEach((spot) => {
    listOfSpots.push(spot.toJSON());
  });

  listOfSpots.forEach((spot) => {
    let listOfReviewStars = [];

    spot.Reviews.forEach((review) => {
      listOfReviewStars.push(review.stars);
    });
    let sum = 0;
    for (let i = 0; i < listOfReviewStars.length; i++) {
      sum += listOfReviewStars[i];
    }
    let average = sum / listOfReviewStars.length;
    spot.avgRating = average;
    delete spot.Reviews;
  });

  listOfSpots.forEach((spot) => {
    spot.SpotImages.forEach((image) => {
      if (image.preview) {
        spot.previewImage = image.url;
        delete spot.SpotImages;
      }
    });
  });
  return res.status(200).json({ Spots: listOfSpots });
});

//* GET BOOKINGS BY SPOT ID

router.get(`/:spotId/bookings`, requireAuth, async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const currentSpotOwnerId = spot.dataValues.ownerId;

  if (currentUserId !== currentSpotOwnerId) {
    console.log("Hello?");
    const bookings = await Booking.findAll({
      where: { spotId: req.params.spotId },
      attributes: [`spotId`, `startDate`, `endDate`],
    });
    return res.status(200).json({ Bookings: bookings });
  }

  const bookings = await Booking.findAll({
    where: { spotId: req.params.spotId },
    include: [{ model: User, attributes: [`id`, `firstName`, `lastName`] }],
  });

  return res.status(200).json({ Bookings: bookings });
});

//* GET REVIEWS BY SPOT ID

router.get(`/:spotId/reviews`, async (req, res, next) => {
  const spot = await Spot.findByPk(req.params.spotId);
  if (!spot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }
  const reviews = await Review.findAll({
    where: { spotId: req.params.spotId },
    include: [
      { model: User, attributes: [`id`, `firstName`, `lastName`] },
      { model: ReviewImage, attributes: [`id`, `url`] },
    ],
  });

  res.status(200).json({ Reviews: reviews });
});

//* GET DETAILS BY SPOT ID

router.get(`/:spotId`, async (req, res, _next) => {
  const spot = await Spot.findByPk(req.params.spotId, {
    include: [
      { model: Review },
      { model: SpotImage, attributes: [`id`, `url`, `preview`] },
      { model: User, as: `Owner`, attributes: [`id`, `firstName`, `lastName`] },
    ],
  });

  if (!spot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }

  const spotData = spot.toJSON();
  let listOfReviewStars = [];
  let numReviews = 0;

  spotData.Reviews.forEach((review) => {
    listOfReviewStars.push(review.stars);
    numReviews++;
  });

  let sum = 0;
  for (let i = 0; i < listOfReviewStars.length; i++) {
    sum += listOfReviewStars[i];
  }

  let average = sum / listOfReviewStars.length;
  spotData.avgRating = average;
  spotData.numReviews = numReviews;
  delete spotData.Reviews;

  return res.status(200).json(spotData);
});
//* GET ALL SPOTS
//! BELOW
const validateQuery = [
  check("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be greater than or equal to 1"),
  check("size")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Size must be greater than or equal to 1"),
  check("maxLat")
    .optional()
    .isFloat()
    .withMessage("Maximum latitude is invalid"),
  check("minLat")
    .optional()
    .isFloat()
    .withMessage("Minimum latitude is invalid"),
  check("minLng")
    .optional()
    .isFloat()
    .withMessage("Minimum longitude is invalid"),
  check("maxLng")
    .optional()
    .isFloat()
    .withMessage("Maximum longitude is invalid"),
  check("minPrice")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum price must be greater than or equal to 0"),
  check("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be greater than or equal to 0"),
  handleValidationErrors,
];

router.get(`/`, validateQuery, async (req, res, _next) => {
  let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } =
    req.query;

  if (!page) page = 1;
  if (!size) size = 20;
  let pagination = {};
  if (page >= 1 && page <= 10) {
    pagination.offset = (page - 1) * size;
  }
  if (size >= 1 && size <= 20) {
    pagination.limit = size;
  }
  let queryObj = {
    where: {},
    include: [{ model: Review }, { model: SpotImage }],
    ...pagination,
  };

  if (minLat && maxLat) {
    query.where.lat = { [Sequelize.Op.between]: [minLat, maxLat] };
  }

  if (minLng && maxLng) {
    query.where.lng = { [Sequelize.Op.between]: [minLng, maxLng] };
  }

  if (minPrice !== undefined && maxPrice !== undefined) {
    query.where.price = { [Sequelize.Op.between]: [minPrice, maxPrice] };
  }

  const spots = await Spot.findAll(queryObj);
  console.log(spots);
  let listOfSpots = [];

  spots.forEach((spot) => {
    listOfSpots.push(spot.toJSON());
  });

  listOfSpots.forEach((spot) => {
    let listOfReviewStars = [];

    spot.Reviews.forEach((review) => {
      listOfReviewStars.push(review.stars);
    });
    let sum = 0;
    for (let i = 0; i < listOfReviewStars.length; i++) {
      sum += listOfReviewStars[i];
    }
    let average = sum / listOfReviewStars.length;
    spot.avgRating = average;
    delete spot.Reviews;
  });

  listOfSpots.forEach((spot) => {
    spot.SpotImages.forEach((image) => {
      if (image.preview) {
        spot.previewImage = image.url;
        delete spot.SpotImages;
      }
    });
  });

  console.log(listOfSpots);

  res
    .status(200)
    .json({ Spots: listOfSpots, page: parseInt(page), size: parseInt(size) });
});

//!ABOVE

const validateReview = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("Review text is required"),
  check("stars")
    .exists({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage("Stars must be an integer from 1 to 5"),
  handleValidationErrors,
];

const validateSpot = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  check("city").exists({ checkFalsy: true }).withMessage("City is required"),
  check("state").exists({ checkFalsy: true }).withMessage("State is required"),
  check("country")
    .exists({ checkFalsy: true })
    .withMessage("Country is required"),
  check("lat")
    .exists({ checkFalsy: true })
    .isFloat()
    .withMessage("Latitude is not valid"),
  check("lng")
    .exists({ checkFalsy: true })
    .isFloat()
    .withMessage("Longitude is not valid"),
  check("name")
    .exists({ checkFalsy: true })
    .isLength({ min: 4, max: 49 })
    .withMessage("Name must be less than 50 characters"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required"),
  check("price")
    .exists({ checkFalsy: true })
    .withMessage("Price per day is required"),
  handleValidationErrors,
];

const validateBooking = [
  check("startDate").exists({ checkFalsy: true }),
  check("endDate")
    .exists({ checkFalsy: true })
    .withMessage("endDate cannot be on or before startDate"),
  handleValidationErrors,
];
//* CREATE A BOOKING FOR A SPOT USING SPOT ID

router.post(
  `/:spotId/bookings`,
  requireAuth,
  validateBooking,
  async (req, res, next) => {
    const currentSpot = await Spot.findByPk(req.params.spotId, {
      include: [{ model: Booking }],
    });

    if (!currentSpot) {
      return res.status(404).json({ message: `Spot couldn't be found` });
    }

    const { startDate, endDate } = req.body;

    const currentBookingStartDate = new Date(startDate);
    const currentBookingEndDate = new Date(endDate);

    const currentBookingStartDateTime = currentBookingStartDate.getTime();
    const currentBookingEndDateTime = currentBookingEndDate.getTime();

    if (currentBookingStartDateTime >= currentBookingEndDateTime) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          endDate: "endDate cannot be on or before startDate",
        },
      });
    }

    const currentUserId = req.user.dataValues.id;

    let listOfBookings = [];
    const bookings = currentSpot.dataValues.Bookings;
    bookings.forEach((booking) => {
      listOfBookings.push(booking.toJSON());
    });

    for (let i = 0; i < listOfBookings.length; i++) {
      const reservedBookingStartDate = new Date(listOfBookings[i].startDate);
      const reservedBookingEndDate = new Date(listOfBookings[i].endDate);

      const reservedBookingStartDateTime = reservedBookingStartDate.getTime();
      const reservedBookingEndDateTime = reservedBookingEndDate.getTime();

      if (
        currentBookingStartDateTime >= reservedBookingStartDateTime &&
        currentBookingEndDateTime <= reservedBookingEndDateTime
      ) {
        return res.status(403).json({
          message: `Sorry, this spot is already booked for the specified dates`,
        });
      }

      if (
        currentBookingStartDateTime < reservedBookingStartDateTime &&
        currentBookingEndDateTime >= reservedBookingStartDateTime
      ) {
        return res
          .status(403)
          .json({ message: `End date conflicts with an existing booking` });
      }

      if (
        currentBookingStartDateTime <= reservedBookingEndDateTime &&
        currentBookingEndDateTime > reservedBookingEndDateTime
      ) {
        return res
          .status(403)
          .json({ message: `Start date conflicts with an existing booking` });
      }
    }

    const newBooking = await currentSpot.createBooking({
      spotId: req.params.spotId,
      userId: currentUserId,
      startDate: startDate,
      endDate: endDate,
    });

    await currentSpot.save();
    return res.status(200).json(newBooking);
  }
);

//* CREATE A REVIEW FOR A SPOT USING SPOT ID

router.post(
  `/:spotId/reviews`,
  requireAuth,
  validateReview,
  async (req, res, _next) => {
    const currentSpot = await Spot.findByPk(req.params.spotId, {
      include: [{ model: Review }],
    });

    if (!currentSpot) {
      return res.status(404).json({ message: `Spot couldn't be found` });
    }

    const currentUserId = req.user.dataValues.id;

    let listOfReviews = [];

    const reviews = currentSpot.dataValues.Reviews;

    reviews.forEach((review) => {
      listOfReviews.push(review.toJSON());
    });

    for (let i = 0; i < listOfReviews.length; i++) {
      if (listOfReviews[i].userId === currentUserId) {
        return res
          .status(500)
          .json({ message: `User already has a review for this spot` });
      }
    }

    const { review, stars } = req.body;

    const newReview = await currentSpot.createReview({
      userId: currentUserId,
      spotId: req.params.spotId,
      review,
      stars,
    });

    await currentSpot.save();

    return res.status(201).json(newReview);
  }
);

//* CREATE AN IMAGE FOR A SPOT USING SPOT ID

router.post(`/:spotId/images`, requireAuth, async (req, res, _next) => {
  const currentSpot = await Spot.findByPk(req.params.spotId);

  if (!currentSpot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const currentSpotOwnerId = currentSpot.dataValues.ownerId;

  if (currentUserId !== currentSpotOwnerId) {
    return res.status(403).json({ message: `Forbidden` });
  }
  const { url, preview } = req.body;

  const newImage = await currentSpot.createSpotImage({
    url,
    preview,
  });
  await currentSpot.save();
  const newImageData = newImage.toJSON();

  delete newImageData.spotId;
  delete newImageData.updatedAt;
  delete newImageData.createdAt;

  return res.status(200).json(newImageData);
});

//* CREATE A SPOT
router.post(`/`, requireAuth, validateSpot, async (req, res, _next) => {
  const currentUserId = req.user.dataValues.id;

  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const newSpot = await Spot.create({
    address,
    ownerId: currentUserId,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });
  if (!newSpot) {
    return res.status(400).json();
  }
  res.status(201).json(newSpot);
});

//* EDIT A SPOT
router.put(`/:spotId`, requireAuth, validateSpot, async (req, res, _next) => {
  const currentSpot = await Spot.findByPk(req.params.spotId);

  if (!currentSpot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const currentSpotOwnerId = currentSpot.dataValues.ownerId;

  if (currentUserId !== currentSpotOwnerId) {
    return res.status(403).json({ message: `Forbidden` });
  }

  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  if (address) {
    currentSpot.address = address;
  }
  if (city) {
    currentSpot.city = city;
  }
  if (state) {
    currentSpot.state = state;
  }
  if (country) {
    currentSpot.country = country;
  }
  if (lat) {
    currentSpot.lat = lat;
  }
  if (lng) {
    currentSpot.lng = lng;
  }
  if (name) {
    currentSpot.name = name;
  }
  if (description) {
    currentSpot.description = description;
  }
  if (price) {
    currentSpot.price = price;
  }

  await currentSpot.save();
  return res.status(200).json(currentSpot);
});

//* DELETE A SPOT

router.delete(`/:spotId`, requireAuth, async (req, res, next) => {
  const currentSpot = await Spot.findByPk(req.params.spotId);

  if (!currentSpot) {
    return res.status(404).json({ message: `Spot couldn't be found` });
  }

  const currentUserId = req.user.dataValues.id;

  const currentSpotOwnerId = currentSpot.dataValues.ownerId;

  if (currentUserId !== currentSpotOwnerId) {
    return res.status(403).json({ message: `Forbidden` });
  }

  await currentSpot.destroy();

  res.status(200).json({ message: `Successfully deleted` });
});

module.exports = router;
