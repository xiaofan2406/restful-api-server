const express = require('express');
const router = express.Router();
const models = require('../models');
const { User } = models;
const passport = require('../helpers/authentication');
const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });

router.get('/', requireAuth, (req, res, next) => {
  res.send('index');
  next();
});

router.post('/signup', (req, res, next) => {
  const { email, password } = req.body;

  User.create({ email, password }).then((user) => {
    res.status(201).json({
      token: user.getToken(),
      email: user.email
    });
  }).catch((err) => {
    next(err);
  });
});

router.post('/login', requireSignin, (req, res, next) => {
  res.json('logged in');
  next();
});


module.exports = router;
