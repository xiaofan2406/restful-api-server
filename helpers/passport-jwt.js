import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JWT_SECRET } from '../config/jwt-config';

import { User } from '../models';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('token'),
  secretOrKey: JWT_SECRET
};

const jwtLogin = new Strategy(jwtOptions, (payload, done) => {
  User.findById(payload.sub).then(user => {
    if (!user) {
      return done(null, false, { message: 'Invalid user token' });
    }
    if (!user.activated) {
      return done(null, false, { message: 'User not activated' });
    }
    return done(null, user);
  }).catch((err) => {
    return done(err, false);
  });
});

passport.use(jwtLogin);

export default (req, res, next) => {
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
