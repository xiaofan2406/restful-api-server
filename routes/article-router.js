const express = require('express');
const router = express.Router();
const { Article } = require('../models');
const requireAuth = require('../helpers/passport-jwt');
const {
  isThere,
  isJSON
} = require('../helpers/validator');
const Error = require('../helpers/errors');
const unprocessableEntityError = Error(422, 'Invalid request data');

function requireTitleContentInBody(req, res, next) {
  const { title, content } = req.body;
  if (!isThere(title) || !isThere(content)) {
    return next(unprocessableEntityError);
  }
  next();
}

function requireJsonBody(req, res, next) {
  if (!isJSON(req.body)) {
    return next(unprocessableEntityError);
  }
  next();
}

function createSingleArticle(req, res, next) {
  const articleData = req.body;
  const user = req.user;
  Article.createSingle(articleData, user)
  .then(article => {
    res.status(201).json(article.selfie());
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
  Article.editSingle(articleId, updates, user)
  .then(updatedArticle => {
    res.status(200).json(updatedArticle.selfie());
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
