const express = require('express');
const router = express.Router();
const models = require('../models');
const { User } = models;
const requireAuth = require('../helpers/passport-jwt');
const requireSignin = require('../helpers/passport-local');

const Utils = require('../helpers/utils.js');

function validateReqBody(req, res, next) {
  const { email, password } = req.body;

  if (!Utils.isThere(email) || !Utils.isThere(password) || !Utils.isEmail(email)) {
    const err = new Error();
    err.message = 'Invalid request data';
    err.status = 422;
    next(err);
  }
  next();
}

function signUp(req, res, next) {
  const { email, password } = req.body;

  User.create({ email, password, displayName: email }).then(user => {
    res.status(201).json({
      token: user.getToken(),
      displayName: user.displayName
    });
  }).catch(error => {
    next(error);
  });
}

function signIn(req, res) {
  res.status(200).json({
    token: req.user.getToken(),
    displayName: req.user.displayName
  });
}

router.post('/signup', validateReqBody, signUp);

router.post('/signin', validateReqBody, requireSignin, signIn);

router.get('/', requireAuth, (req, res) => {
  res.status(200).json({ message: 'index page' });
});


module.exports = router;
