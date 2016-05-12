const passport = require('passport');
const JWT_SECRET = require('../config/jwt-config').JWT_SECRET;

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const LocalStrategy = require('passport-local').Strategy;

const User = require('../models').User;

/**
 * JWT authentication
 */
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('token'),
  secretOrKey: JWT_SECRET
};
const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  User.findById(payload.sub).then((user) => {
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  }).catch((err) => {
    return done(err, false);
  });
});


/**
 * user login authentication
 */
const localOptions = {
  usernameField: 'email',
  passwordField: 'password'
};
const localLogin = new LocalStrategy(localOptions, (email, password, done) => {
  User.findOne({ where: { email } }).then(user => {
    if (!user) {
      return done(null, false);
    }
    return user.validPassword(password, (err, isMatch) => {
      if (err) {
        return done(err, false);
      }
      if (!isMatch) {
        return done(null, false);
      }
      return done(null, user);
    });
  }).catch(err => {
    return done(err, false);
  });
});

passport.use(jwtLogin);
passport.use(localLogin);

module.exports = passport;
