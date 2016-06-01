const express = require('express');
const router = express.Router();
const { Article, User } = require('../models');
const requireAuth = require('../helpers/passport-jwt');
const {
  isThere,
  isEmptyObject
} = require('../helpers/validator');

const unauthorizedError = new Error('Unauthorized');
unauthorizedError.status = 401;
const unprocessableEntityError = new Error('Invalid request data');
unprocessableEntityError.status = 422;
const forbiddenError = new Error('Forbidden');
forbiddenError.status = 403;
const duplicateError = new Error('Duplicate');
duplicateError.status = 409;
const preconditionError = new Error('Duplicate');
preconditionError.status = 412;

function requireTitleContentInBody(req, res, next) {
  const { title, content } = req.body;
  if (!isThere(title) || !isThere(content)) {
    return next(unprocessableEntityError);
  }
  next();
}

function requireJsonBody(req, res, next) {
  if (isEmptyObject(req.body)) {
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

  Article.isThereDuplicate(userId, title).then(dupArticle => {
    if (dupArticle) {
      return next(duplicateError);
    }
  }).catch(error => {
    error.status = 500;
    return next(error);
  });

  Article.create({
    title,
    content,
    userId
  })
  .then(article => {
    res.status(201).json({
      id: article.id,
      title: article.title,
      author: req.user.displayName
    });
  })
  .catch(error => {
    error.status = 500;
    next(error);
  });
}

function editSingleArticle(req, res, next) {
  const userId = req.user.id;
  const articleId = req.params.id;
  const updates = req.body;
  Article.findById(articleId)
  .then(article => {
    if (!article) {
      return next(preconditionError);
    }
    if (article.userId !== userId) {
      return next(forbiddenError);
    }
    // TODO add allow fields for article updates
    if (updates.userId) {
      return next(forbiddenError);
    }
    if (updates.title) {
      Article.isThereDuplicate(userId, updates.title).then(dupArticle => {
        if (dupArticle) {
          return next(duplicateError);
        }
      }).catch(error => {
        error.status = 500;
        return next(error);
      });
    }
    article.update(updates)
    .then(newArticle => {
      res.status(200).json(newArticle.selfie());
    })
    .catch(error => {
      error.status = 500;
      return next(error);
    });
  })
  .catch(error => {
    error.status = 500;
    next(error);
  });
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

function getArticles(req, res, next) {
  if (req.query.scope === 'all') {
    getAllArticles(req, res, next);
  } else {
    getPublicArticles(req, res, next);
  }
}


router.post('/', requireTitleContentInBody, requireAuth, createSingleArticle);

router.patch('/:id(\\d+)', requireJsonBody, requireAuth, editSingleArticle);

router.get('/:id(\\d+)', requireAuth, getSingleArticle);

router.get('/public', getPublicArticles);

router.get('/all', requireAuth, getArticles);


module.exports = router;
