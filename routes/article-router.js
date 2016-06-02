const express = require('express');
const router = express.Router();
const { Article, User } = require('../models');
const requireAuth = require('../helpers/passport-jwt');
const {
  isThere,
  isEmptyObject,
  objectHasEmptyValue
} = require('../helpers/validator');

const unauthorizedError = new Error('Unauthorized');
unauthorizedError.status = 401;
const unprocessableEntityError = new Error('Invalid request data');
unprocessableEntityError.status = 422;
const forbiddenError = new Error('Forbidden');
forbiddenError.status = 403;
const duplicateError = new Error('Duplicate');
duplicateError.status = 409;
const preconditionError = new Error('Precondition Fail');
preconditionError.status = 412;

function requireTitleContentInBody(req, res, next) {
  const { title, content } = req.body;
  if (!isThere(title) || !isThere(content)) {
    return next(unprocessableEntityError);
  }
  next();
}

function requireJsonBody(req, res, next) {
  if (isEmptyObject(req.body) || objectHasEmptyValue(req.body)) {
    return next(unprocessableEntityError);
  }
  next();
}

function createSingleArticle(req, res, next) {
  const { title, content } = req.body;

  if (!req.user.isAbleToCreateArticle()) {
    return next(forbiddenError);
  }
  const userId = req.user.id;
  const articleData = {
    title,
    content,
    userId
  };
  Article.createSingle(articleData)
  .then(article => {
    const selfie = article.selfie();
    selfie.author = req.user.selfie();
    res.status(201).json(selfie);
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

function editSingleArticle(req, res, next) {
  const userId = req.user.id;
  const articleId = req.params.id;
  const updates = req.body;
  Article.editSingle(articleId, userId, updates)
  .then(updatedArticle => {
    const selfie = updatedArticle.selfie();
    selfie.author = req.user.selfie();
    res.status(200).json(selfie);
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });

  // Article.findById(articleId)
  // .then(article => {
  //   if (!article) {
  //     return next(preconditionError);
  //   }
  //   if (article.userId !== userId) {
  //     return next(forbiddenError);
  //   }
  //   // TODO add allow fields for article updates
  //   if (updates.userId) {
  //     return next(forbiddenError);
  //   }
  //   if (updates.title) {
  //     Article.isThereDuplicate(userId, updates.title)
  //     .then(dupArticle => {
  //       if (dupArticle) {
  //         return next(duplicateError);
  //       }
  //     }).catch(error => {
  //       error.status = 500;
  //       return next(error);
  //     });
  //   }
  //   article.update(updates)
  //   .then(newArticle => {
  //     res.status(200).json(newArticle.selfie());
  //   })
  //   .catch(error => {
  //     error.status = 500;
  //     return next(error);
  //   });
  // })
  // .catch(error => {
  //   error.status = 500;
  //   next(error);
  // });
}

function getSingleArticle(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;
  Article.findById(id).then(article => {
    if (!article.isPublic && article.userId !== userId) {
      return next(unauthorizedError);
    }
    res.status(200).json(article);
  }).catch(error => {
    next(error);
  });
}

// TODO paging?
function getAllArticles(req, res, next) {
  requireAuth(req, res, next)(req, res, next);
  res.json({
    all: true
  });
}

function getPublicArticles(req, res, next) {
  Article.findAll({
    where: {
      isPublic: true
    },
    include: {
      model: User,
      attributes: ['displayName']
    }
  }).then(result => {
    res.status(200).json(result);
  }).catch(error => {
    next(error);
  });
}


router.post('/', requireTitleContentInBody, requireAuth, createSingleArticle);

router.patch('/:id(\\d+)', requireJsonBody, requireAuth, editSingleArticle);

router.get('/:id(\\d+)', requireAuth, getSingleArticle);

router.get('/public', getPublicArticles);

router.get('/all', requireAuth, getAllArticles);


module.exports = router;
