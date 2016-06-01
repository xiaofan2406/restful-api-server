const express = require('express');
const router = express.Router();
const { User } = require('../models');
const requireAuth = require('../helpers/passport-jwt');
const requireSignin = require('../helpers/passport-local');
const mailer = require('../helpers/mailer');
const {
  isEmail,
  isPassword,
  isThere
} = require('../helpers/validator.js');
const { CLIENT_URL } = require('../config/app-config');

// put these some where else
const unprocessableEntityError = new Error('Invalid request data');
unprocessableEntityError.status = 422;
const conflictRequestError = new Error('Conflict request');
conflictRequestError.status = 409;
const unauthorizedError = new Error('Unauthorized');
unauthorizedError.status = 401;
const internalServerError = new Error('Internal server error');
internalServerError.status = 500;

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

// TODO create a module to contain all emails
function sendVerificationEmail(to, userHash) {
  const content = `
    <style>
      p {
        font-family: 'Source Sans Pro', 'Lucida Grande', sans-serif'
      }
    </style>
    <p>Please click the following link to activate your account.</p>
    <p>
      <a href="${CLIENT_URL}/activateAccount?email=${to}&hash=${userHash}">
        Click here to activate
      </a>
    </p>
  `;
  const mailOptions = {
    from: '"Admin" <admin@restful.com>',
    to,
    subject: 'Activate your account',
    html: content
  };
  return mailer(mailOptions);
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
    error.status = 500;
    return next(error);
  });
}

function signUp(req, res, next) {
  const { email, password } = req.body;

  User.findByEmail(email).then(user => {
    if (user) {
      return next(conflictRequestError);
    }
  }).catch(error => { // database query error
    error.status = 500;
    return next(error);
  });

  User.create({ email, password, displayName: email })
  .then(user => {
    sendVerificationEmail(user.email, user.UUID);
    res.status(202).json({
      email
    });
  })
  .catch(error => { // database query error
    error.status = 500;
    return next(error);
  });
}

function activateAccount(req, res, next) {
  const { email, hash } = req.body;
  User.findByEmail(email).then(user => {
    if (!user) { // email not registered
      return next(unauthorizedError);
    }
    user.activateAccount(email, hash).then(updatedUser => {
      if (updatedUser.activated) { // user should have been updated
        res.status(200).json({
          token: user.getToken(),
          ...user.selfie()
        });
      }
      // this should never happend
      return next(internalServerError);
    }).catch(error => { // database query error
      error.status = error.status || 500;
      return next(error);
    });
  }).catch(error => { // database query error
    error.status = 500;
    return next(error);
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
    displayName: req.user.displayName
  });
}


router.get('/checkEmail', requireEmailInQuery, checkEmail);

router.post('/signUp', requireEmailPasswordInBody, signUp);

router.patch('/activateAccount', requireEmailHashInBody, activateAccount);

router.post('/signIn', requireEmailPasswordInBody, requireSignin, signIn);

router.get('/refreshToken', requireAuth, refreshToken);

router.get('/', requireAuth, (req, res) => {
  res.status(200).json({ message: 'index page' });
});


module.exports = router;
