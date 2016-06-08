const express = require('express');
const router = express.Router();
const { Article } = require('../models');
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
  if (!req.user.isAbleToCreateArticle()) {
    return next(forbiddenError);
  }
  const authorId = req.user.id;
  const articleData = {
    ...req.body,
    authorId
  };
  Article.createSingle(articleData)
  .then(article => {
    const selfie = article.selfie();
    selfie.author = req.user.publicSnapshot();
    res.status(201).json(selfie);
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

function editSingleArticle(req, res, next) {
  const user = req.user;
  const articleId = req.params.id;
  const updates = req.body;
  Article.editSingle(articleId, user, updates)
  .then(updatedArticle => {
    const selfie = updatedArticle.selfie();
    selfie.author = user.publicSnapshot();
    res.status(200).json(selfie);
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

function deleteSingleArticle(req, res, next) {
  const user = req.user;
  const articleId = req.params.id;
  Article.deleteSingle(articleId, user)
  .then(() => {
    res.status(204).end();
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}


function checkHeader(req, res, next) {
  if (req.get('token')) {
    requireAuth(req, res, next);
  } else {
    next();
  }
}

function getSingleArticle(req, res, next) {
  const articleId = req.params.id;
  const user = req.user;
  Article.getSingle(articleId, user)
  .then(data => {
    const selfie = data[0].selfie();
    selfie.author = data[1].publicSnapshot();
    res.status(200).json(selfie);
  }).catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

// TODO paging?
function getAllArticles(req, res, next) {
  const user = req.user;
  Article.getArticles(user)
  .then(data => {
    const articles = data[0].map(article => {
      return article.selfie();
    });
    const authors = data[1].map(author => {
      return author.publicSnapshot();
    });
    res.status(200).json({
      articles,
      authors
    });
  }).catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

router.post('/', requireTitleContentInBody, requireAuth, createSingleArticle);

router.patch('/:id(\\d+)', requireJsonBody, requireAuth, editSingleArticle);

router.delete('/:id(\\d+)', requireAuth, deleteSingleArticle);

router.get('/:id(\\d+)', checkHeader, getSingleArticle);

router.get('/', checkHeader, getAllArticles);

module.exports = router;
