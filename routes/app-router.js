const express = require('express');
const router = express.Router();
const models = require('../models');
const { User } = models;
const requireAuth = require('../helpers/passport-jwt');
const requireSignin = require('../helpers/passport-local');
const mailer = require('../helpers/mailer');
const {
  isEmail,
  isPassword,
  isThere
} = require('../helpers/validator.js');

const unprocessableEntityError = new Error('Invalid request data');
unprocessableEntityError.status = 422;

/**
 * middlewares for validations
 */

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

function requireEmailHashInQuery(req, res, next) {
  const { email, hash } = req.query;
  if (!isEmail(email) || !isThere(hash)) {
    return next(unprocessableEntityError);
  }
  next();
}

function sendVerificationEmail(to, userHash) {
  const content = `
    <style>
      p {
        font-family: 'Source Sans Pro', 'Lucida Grande', sans-serif'
      }
    </style>
    <p>Please click the following link to activate your account.</p>
    <p><a href="http://localhost:3000/activateAccount?hash=${userHash}&email=${to}">Click here to activate.</a></p>
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
  User.findOne({ where: { email } })
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
  User.create({ email, password, displayName: email })
  .then(user => {
    sendVerificationEmail(user.email, user.UUID);
    res.status(202).json({
      displayName: user.displayName
    });
  })
  .catch(error => { // database query error, most likely database validation
    error.status = 422;
    return next(error);
  });
}

function activateAccount(req, res, next) {
  const { email, hash } = req.query;
  User.findOne({ where: { email } }).then(user => {
    user.activateAccount(email, hash).then(updatedUser => {
      res.status(200).json({
        activated: updatedUser.activated,
        displayName: updatedUser.displayName
      });
    }).catch(error => {
      return next(error);
    });
  }).catch(error => { // email is not found
    error.status = 422;
    return next(error);
  });
}

function signIn(req, res) {
  res.status(200).json({
    token: req.user.getToken(),
    displayName: req.user.displayName
  });
}

function refreshToken(req, res) {
  res.status(200).json({
    token: req.user.getToken(),
    displayName: req.user.displayName
  });
}


router.get('/checkEmail', requireEmailInQuery, checkEmail);

router.post('/signUp', requireEmailPasswordInBody, signUp);

router.get('/activateAccount', requireEmailHashInQuery, activateAccount);

router.post('/signIn', requireEmailPasswordInBody, requireSignin, signIn);

router.get('/refreshToken', requireAuth, refreshToken);

router.get('/', requireAuth, (req, res) => {
  res.status(200).json({ message: 'index page' });
});


module.exports = router;
