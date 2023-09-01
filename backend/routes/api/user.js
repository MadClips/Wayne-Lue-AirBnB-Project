//backend/routes/api/users.js
const express = require(`express`);
const bcrypt = require(`bcryptjs`);

const { setTokenCookie, requireAuth } = require(`../../utils/auth`);
const { User } = require(`../../db/models`);

const router = express.Router();

// router.post(`/`, async (req, res) => {
//   const { email, password, username } = req.body;
//   const hashedPassword = bcrypt.hashSync(password);
//   const user = await User.create({ email, username, hashedPassword });

//   const safeUser = {
//     id: user.id,
//     email: user.email,
//     username: user.username,
//   };

//   await setTokenCookie(res, safeUser);

//   return res.json({
//     user: safeUser,
//   });
// });

const { check } = require(`express-validator`);
const { handleValidationErrors } = require(`../../utils/validation`);

//! I ADDED A FIRST AND LAST NAME TO THE VALIDATE SIGNUP VARIABLE

const validateSignup = [
  check("email")
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid email."),
  check("firstName").exists({ checkFalsy: true }),
  check("lastName").exists({ checkFalsy: true }),
  check("username")
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage("Please provide a username with at least 4 characters."),
  check("username").not().isEmail().withMessage("Username cannot be an email."),
  check("password")
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("Password must be 6 characters or more."),
  handleValidationErrors,
];

router.post("", validateSignup, async (req, res) => {
  const { email, password, username } = req.body;
  const hashedPassword = bcrypt.hashSync(password);
  const user = await User.create({ email, username, hashedPassword });

  //! I ADDED A FIRST AND LAST NAME TO THE SAFE USER VARIABLE
  const safeUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
  };

  await setTokenCookie(res, safeUser);

  return res.json({
    user: safeUser,
  });
});

module.exports = router;
