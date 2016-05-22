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

const requireJwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      const newErr = new Error(info.message);
      newErr.status = 401;
      return next(newErr);
    }
    req.user = user;
    return next();
  })(req, res, next);
};

module.exports = requireJwt;
