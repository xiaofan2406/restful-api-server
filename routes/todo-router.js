const express = require('express');
const router = express.Router();
const { Todo } = require('../models');
const requireAuth = require('../helpers/passport-jwt');
const {
  isThere
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

function requireTitleInBody(req, res, next) {
  const { title } = req.body;
  if (!isThere(title)) {
    return next(unprocessableEntityError);
  }
  next();
}

function createSingleTodo(req, res, next) {
  const todoData = req.body;
  Todo.createSingle(todoData, req.user).then(todo => {
    res.status(201).json(todo);
  }).catch(error => {
    error.status = error.status || 500;
    next(error);
  });
}


router.post('/', requireTitleInBody, requireAuth, createSingleTodo);
//
// router.patch('/:id(\\d+)', requireJsonBody, requireAuth, editSingleTodo);
//
// router.delete('/:id(\\d+)', requireAuth, deleteSingleTodo);
//
// router.get('/:id(\\d+)', checkHeader, getSingleTodo);
//
// router.get('/', checkHeader, getAllTodos);

module.exports = router;
