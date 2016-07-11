import { Router } from 'express';
import { User } from '../models';
import requireAuth from '../helpers/passport-jwt';
import { sendVerificationEmail } from '../helpers/mailer';
import {
  isEmail,
  isPassword,
  isThere,
  isJSON
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

function requireEmailHashInBody(req, res, next) {
  const { email, hash } = req.body;
  if (!isEmail(email) || !isThere(hash)) {
    return next(InvalidRequestDataError);
  }
  next();
}

function requireJsonBody(req, res, next) {
  if (!isJSON(req.body)) {
    return next(InvalidRequestDataError);
  }
  next();
}

function createUser(req, res, next) {
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

function activateUser(req, res, next) {
  const { email, hash } = req.body;
  User.activateAccount(email, hash)
  .then(updatedUser => {
    res.status(200).json({
      token: updatedUser.getToken(),
      ...updatedUser.selfie()
    });
  })
  .catch(error => {
    next(error);
  });
}

const updateUserBy = field => (req, res, next) => {
  const httpUser = req.user;
  const edits = req.body;
  const value = req.params[field];
  User.updateSingle(field, value, edits, httpUser)
  .then(updatedUser => {
    res.status(200).json(updatedUser.selfie());
  })
  .catch(error => {
    next(error);
  });
};

function checkHeader(req, res, next) {
  if (req.get('token')) {
    return requireAuth(req, res, next);
  }
  next();
}

router.post('/', requireEmailPasswordInBody, checkHeader, createUser);

router.patch('/:id(\\d+)', requireJsonBody, requireAuth, updateUserBy('id'));

router.patch('/activate', requireEmailHashInBody, activateUser);

// TODO avoid username being 'activate' or other key words
router.patch('/:username', requireJsonBody, requireAuth, updateUserBy('username'));


export default router;
