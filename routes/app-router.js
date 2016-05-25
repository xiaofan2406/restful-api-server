const express = require('express');
const router = express.Router();
const models = require('../models');
const { User } = models;
const requireAuth = require('../helpers/passport-jwt');
const requireSignin = require('../helpers/passport-local');
const {
  isEmail,
  isPassword
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
      token: user.getToken(),
      displayName: user.displayName
    });
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

router.get('/refreshToken', requireAuth, refreshToken);

router.post('/signUp', requireEmailPasswordInBody, signUp);

router.post('/signIn', requireEmailPasswordInBody, requireSignin, signIn);

router.get('/', requireAuth, (req, res) => {
  res.status(200).json({ message: 'index page' });
});


module.exports = router;
