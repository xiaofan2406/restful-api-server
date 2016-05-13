const express = require('express');
const router = express.Router();
const models = require('../models');
const { User } = models;
const passport = require('../helpers/authentication');
const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });
const Utils = require('../helpers/utils.js');

router.get('/', requireAuth, (req, res, next) => {
  res.send('index');
  next();
});


const signup = (req, res, next) => {
  const { email, password } = req.body;
  if (!Utils.isEmail(email)) {
    const err = new Error('Not a valid email');
    err.status = 400;
    next(err);
    return;
  }

  User.create({ email, password }).then((user) => {
    res.status(201).json({
      token: user.getToken(),
      email: user.email,
      id: user.id
    });
  }).catch((err) => {
    next(err);
  });
};


router.post('/signup', signup);

router.post('/login', requireSignin, (req, res, next) => {
  // passport automatically assign the logged in user to req.user
  const loginUser = req.user;

  res.status(200).json({
    token: loginUser.getToken(),
    email: loginUser.email,
    id: loginUser.id
  });
  next();
});


module.exports = router;
