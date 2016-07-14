import { Router } from 'express';
import { User } from '../models';
import requireAuth from '../helpers/passport-jwt';
import requireSignin from '../helpers/passport-local';
import { sendVerificationEmail } from '../helpers/mailer';
import fieldsValidator from '../helpers/fieldsValidator';

const router = Router();

function createUser(req, res, next) {
  const userData = req.body;
  const httpUser = req.user;
  User.createSingle(userData, httpUser)
  .then(user => {
    if (!user.activated) {
      sendVerificationEmail(user.email, user.uniqueId);
    }
    res.status(202).json(user.publicInfo());
  })
  .catch(error => {
    return next(error);
  });
}

function activateUser(req, res, next) {
  const { email, uniqueId } = req.body;
  User.activateAccount(email, uniqueId)
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

function updateUserBy(field) {
  return (req, res, next) => {
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
}

function checkHeader(req, res, next) {
  if (req.get('token')) {
    return requireAuth(req, res, next);
  }
  next();
}

function checkEmail(req, res, next) {
  const { email } = req.query;
  User.findByEmail(email)
  .then(user => {
    res.status(200).json({
      isRegistered: Boolean(user)
    });
  })
  .catch(error => {
    next(error);
  });
}

function signIn(req, res) {
  res.status(200).json({
    token: req.user.getToken(),
    ...req.user.selfie()
  });
}

function getUserBy(field) {
  return (req, res, next) => {
    const httpUser = req.user;
    const value = req.params[field];
    User.getSingle(field, value, httpUser)
    .then(user => {
      res.status(200).json(user.selfie());
    })
    .catch(error => {
      next(error);
    });
  };
}

// TODO avoid username being 'activate' or other key words

router.post('/', fieldsValidator('body', User, ['email', 'password']), checkHeader, createUser);

router.patch('/:id(\\d+)', fieldsValidator('body', User), requireAuth, updateUserBy('id'));

router.patch('/activate', fieldsValidator('body', User, ['email', 'uniqueId']), activateUser);

router.patch('/:username', fieldsValidator('body', User), requireAuth, updateUserBy('username'));

router.get('/checkEmail', fieldsValidator('query', User, ['email']), checkEmail);

router.post('/signIn', fieldsValidator('body', User, ['email', 'password']), requireSignin, signIn);

router.get('/refreshToken', requireAuth, signIn);

router.get('/:id(\\d+)', requireAuth, getUserBy('id'));

router.get('/:username', requireAuth, getUserBy('username'));

export default router;
