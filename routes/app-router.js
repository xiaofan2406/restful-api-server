const express = require('express');
const router = express.Router();
const { User } = require('../models');
const requireAuth = require('../helpers/passport-jwt');
const requireSignin = require('../helpers/passport-local');
const { sendVerificationEmail } = require('../helpers/mailer');
const {
  isEmail,
  isPassword,
  isThere
} = require('../helpers/validator.js');
const Error = require('../helpers/errors');
const unprocessableEntityError = Error(422, 'Invalid request data');

/**
 * middlewares for validations
 */
// TODO manage all request parameters in a combinde middleware
function requireEmailPasswordInBody(req, res, next) {
  const { email, password } = req.body;
  if (!isPassword(password) || !isEmail(email)) {
    return next(unprocessableEntityError);
  }
  next();
}

function requireEmailInQuery(req, res, next) {
  const { email } = req.query;
  if (!isEmail(email)) {
    return next(unprocessableEntityError);
  }
  next();
}

function requireEmailHashInBody(req, res, next) {
  const { email, hash } = req.body;
  if (!isEmail(email) || !isThere(hash)) {
    return next(unprocessableEntityError);
  }
  next();
}

/**
 * controllers for each routes,
 * all the req data should be considered in valid format beyond here
 */

function checkEmail(req, res, next) {
  const { email } = req.query;
  User.findByEmail(email)
  .then(user => {
    res.status(200).json({
      isRegistered: Boolean(user)
    });
  })
  .catch(error => { // database query error
    next(error);
  });
}

function signUp(req, res, next) {
  const userData = req.body;
  User.createSingle(userData)
  .then(user => {
    sendVerificationEmail(user.email, user.UUID);
    res.status(202).json({
      email: user.email
    });
  })
  .catch(error => {
    return next(error);
  });
}

function activateAccount(req, res, next) {
  const { email, hash } = req.body;
  User.activateAccount(email, hash)
  .then(updatedUser => {
    res.status(200).json({
      token: updatedUser.getToken(),
      ...updatedUser.selfie()
    });
  })
  .catch(error => {
    next(error);
  });
}

function signIn(req, res) {
  res.status(200).json({
    token: req.user.getToken(),
    ...req.user.selfie()
  });
}

// TODO review how jwt token works
function refreshToken(req, res) {
  res.status(200).json({
    token: req.user.getToken(),
    ...req.user.selfie()
  });
}

router.get('/checkEmail', requireEmailInQuery, checkEmail);

router.post('/signUp', requireEmailPasswordInBody, signUp);

router.patch('/activateAccount', requireEmailHashInBody, activateAccount);

router.post('/signIn', requireEmailPasswordInBody, requireSignin, signIn);

router.get('/refreshToken', requireAuth, refreshToken);

router.get('/', requireAuth, (req, res) => {
  // todo send documentation
  res.status(200).json({ message: 'index page' });
});

module.exports = router;
