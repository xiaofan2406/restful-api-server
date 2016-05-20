const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const JWT_SECRET = require('../config/jwt-config').JWT_SECRET;
const User = require('../models').User;

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

passport.use(jwtLogin);
module.exports = passport.authenticate('jwt', { session: false });
