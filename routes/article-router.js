const express = require('express');
const router = express.Router();
const { Article } = require('../models');
const requireAuth = require('../helpers/passport-jwt');

const unauthorizedError = new Error('Unauthorized');
unauthorizedError.status = 401;

function createArticle(req, res, next) {
  const { title, content } = req.body;
  const userId = req.user.id;
  Article.create({
    title,
    content,
    userId,
    idWithAuthor: `U${userId}A${title}`
  })
  .then(article => {
    res.json(article);
  })
  .catch(error => {
    next(error);
  });
}

function getArticle(req, res, next) {
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

router.post('/', requireAuth, createArticle);

router.get('/:id', requireAuth, getArticle);


module.exports = router;
