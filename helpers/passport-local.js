const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models').User;

const localOptions = {
  usernameField: 'email',
  passwordField: 'password'
};

const localLogin = new LocalStrategy(localOptions, (email, password, done) => {
  User.findByEmail(email).then(user => {
    if (!user) {
      return done(null, false, {
        message: 'The email is not registered',
        status: 401
      });
    }
    return user.validPassword(password, (err, isMatch) => {
      if (err) {
        return done(err, false);
      }
      if (!isMatch) {
        return done(null, false, {
          message: 'The password does not match the email address',
          status: 401
        });
      }
      if (!user.activated) {
        return done(null, false, {
          message: 'The user has not yet verify his email address',
          status: 401
        });
      }
      return done(null, user);
    });
  }).catch(err => {
    return done(err, false);
  });
});

passport.use(localLogin);

const requireSignin = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      const newErr = new Error(info.message);
      newErr.status = info.status;
      return next(newErr);
    }
    req.user = user;
    return next();
  })(req, res, next);
};

module.exports = requireSignin;
