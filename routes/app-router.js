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
    <p><a href="http://192.168.1.49:3000/activateAccount?hash=${userHash}&email=${to}">Click here to activate.</a></p>
  `;
  const mailOptions = {
    from: '"Admin" <admin@restful.com>',
    to,
    subject: 'Activate your account',
    html: content
  };
  return mailer(mailOptions);
}

function checkEmail(req, res, next) {
  const { email } = req.query;
  User.findOne({ where: { email } }).then(user => {
    res.status(200);
    if (!user) {
      res.json({
        isRegistered: false
      });
    } else {
      res.json({
        isRegistered: true
      });
    }
  }).catch(error => {
    error.status = 422;
    return next(error);
  });
}

function activateAccount(req, res, next) {
  const { email, hash } = req.query;
  User.findOne({ where: { email } }).then(user => {
    if (user.activated === true) {
      // some something
    }

    if (user.activateAccount(email, hash)) { // success
      res.status(200).json({
        activated: true
      });
    } else { // fail activation

    }
  }).catch(error => {
    error.status = 422;
    return next(error);
  });
}


function refreshToken(req, res) {
  res.status(200).json({
    token: req.user.getToken(),
    displayName: req.user.displayName
  });
}


function signUp(req, res, next) {
  const { email, password } = req.body;
  User.create({ email, password, displayName: email }).then(user => {
    res.status(201).json({
      user: user.email,
      result: 'okay'
    });
    sendVerificationEmail(user.email, user.UUID);
  }).catch(error => {
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


router.get('/checkEmail', requireEmailInQuery, checkEmail);

router.get('/activateAccount', requireEmailHashInQuery, activateAccount);

router.get('/refreshToken', requireAuth, refreshToken);

router.post('/signUp', requireEmailPasswordInBody, signUp);

router.post('/signIn', requireEmailPasswordInBody, requireSignin, signIn);

router.get('/', requireAuth, (req, res) => {
  res.status(200).json({ message: 'index page' });
});


module.exports = router;
