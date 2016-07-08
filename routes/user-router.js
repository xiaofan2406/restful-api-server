import { Router } from 'express';
import { User } from '../models';
import requireAuth from '../helpers/passport-jwt';
import requireSignin from '../helpers/passport-local';
import { sendVerificationEmail } from '../helpers/mailer';
import {
  isEmail,
  isPassword,
  isThere
} from '../helpers/validator.js';
import { InvalidRequestDataError } from '../helpers/errors';

const router = Router();

/**
 * middlewares for validations
 */
// TODO manage all request parameters in a combinde middleware
function requireEmailPasswordInBody(req, res, next) {
  const { email, password } = req.body;
  if (!isPassword(password) || !isEmail(email)) {
    return next(InvalidRequestDataError);
  }
  next();
}

function createSingleUser(req, res, next) {
  const userData = req.body;
  const httpUser = req.user;
  User.createSingle(userData, httpUser)
  .then(user => {
    if (!user.activated) {
      sendVerificationEmail(user.email, user.UUID);
    }
    res.status(202).json(user.publicInfo());
  })
  .catch(error => {
    return next(error);
  });
}

function editSingleUser(req, res, next) {

}

function checkHeader(req, res, next) {
  if (req.get('token')) {
    return requireAuth(req, res, next);
  }
  next();
}

router.post('/', requireEmailPasswordInBody, checkHeader, createSingleUser);

router.patch('/:username', requireAuth, editSingleUser);

export default router;
