const express = require('express');
const router = express.Router();
const models = require('../models');
const { User } = models;
const requireAuth = require('../helpers/passport-jwt');
const requireSignin = require('../helpers/passport-local');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt-config').JWT_SECRET;

const Utils = require('../helpers/utils.js');

function requireEmailPassword(req, res, next) {
  const { email, password } = req.body;
  if (!Utils.isThere(password) || !Utils.isEmail(email)) {
    const err = new Error();
    err.message = 'Invalid request data';
    err.status = 422;
    next(err);
  }
  next();
}

function requireEmail(req, res, next) {
  const { email } = req.query;
  if (!Utils.isEmail(email)) {
    const err = new Error();
    err.message = 'Invalid request data';
    err.status = 422;
    next(err);
  }
  next();
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
    next(error);
  });
}

function signIn(req, res) {
  res.status(200).json({
    token: req.user.getToken(),
    displayName: req.user.displayName
  });
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
    next(error);
  });
}

router.get('/checkEmail', requireEmail, checkEmail);

router.get('/refreshToken', requireAuth, refreshToken);

router.post('/signUp', requireEmailPassword, signUp);

router.post('/signIn', requireEmailPassword, requireSignin, signIn);

router.get('/', requireAuth, (req, res) => {
  res.status(200).json({ message: 'index page' });
});


module.exports = router;
