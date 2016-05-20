const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models').User;

const localOptions = {
  usernameField: 'email',
  passwordField: 'password'
};

const localLogin = new LocalStrategy(localOptions, (email, password, done) => {
  User.findOne({ where: { email } }).then(user => {
    if (!user) {
      return done(null, false, { field: 'email', message: 'Incorrect email' });
    }
    return user.validPassword(password, (err, isMatch) => {
      if (err) {
        return done(err, false);
      }
      if (!isMatch) {
        return done(null, false, { field: 'password', message: 'Incorrect password' });
      }
      return done(null, user);
    });
  }).catch(err => {
    return done(err, false);
  });
});

passport.use(localLogin);

const requireSignin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      const newErr = new Error();
      newErr.status = 401;
      newErr.field = info.field;
      newErr.message = info.message;
      return next(newErr);
    }
    req.user = user;
    return next();
  })(req, res, next);
};

module.exports = requireSignin;
