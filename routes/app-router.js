const express = require('express');
const router = express.Router();
const models = require('../models');
const { User } = models;
const passport = require('../helpers/authentication');
const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });

router.get('/', requireAuth, (req, res) => {
  res.status(200).json({ message: 'index page' });
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

router.post('/signin', requireSignin, (req, res) => {
  res.status(200).json(req.user.getToken());
});


module.exports = router;
