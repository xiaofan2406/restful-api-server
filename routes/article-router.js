const express = require('express');
const router = express.Router();
const { Article, User } = require('../models');
const requireAuth = require('../helpers/passport-jwt');

const unauthorizedError = new Error('Unauthorized');
unauthorizedError.status = 401;

function createArticle(req, res, next) {
  const { title, content } = req.body;
  const userId = req.user.id;
  Article.create({
    title,
    content,
    userId
  })
  .then(article => {
    res.json(article);
  })
  .catch(error => {
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

function getPublicAriticles(req, res, next) {
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
    getPublicAriticles(req, res, next);
  }
}


router.post('/', requireAuth, createArticle);


router.get('/:id(\\d+)', requireAuth, getSingleArticle);


router.get('/public', getPublicAriticles);

router.get('/all', requireAuth, getArticles);


module.exports = router;
