const express = require('express');
const router = express.Router();
const { Todo } = require('../models');
const requireAuth = require('../helpers/passport-jwt');
const {
  isThere,
  isEmptyObject,
  objectHasEmptyValue,
  isUUID
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

function requireJsonBody(req, res, next) {
  if (isEmptyObject(req.body) || objectHasEmptyValue(req.body)) {
    return next(unprocessableEntityError);
  }
  next();
}

function requireUUIDParam(req, res, next) {
  if (!isUUID(req.params.id)) {
    return next(unprocessableEntityError);
  }
  next();
}

function createSingleTodo(req, res, next) {
  const todoData = req.body;
  const user = req.user;
  Todo.createSingle(todoData, user).then(todo => {
    res.status(201).json(todo.selfie());
  }).catch(error => {
    error.status = error.status || 500;
    next(error);
  });
}

function editSingleTodo(req, res, next) {
  const user = req.user;
  const todoId = req.params.id;
  const updates = req.body;
  Todo.editSingle(todoId, updates, user).then(updatedTodo => {
    res.status(200).json(updatedTodo.selfie());
  }).catch(error => {
    error.status = error.status || 500;
    next(error);
  });
}

function toggleSingleTodo(req, res, next) {
  const user = req.user;
  const todoId = req.params.id;
  Todo.toggleSingle(todoId, user).then(updatedTodo => {
    res.status(200).json(updatedTodo.selfie());
  }).catch(error => {
    error.status = error.status || 500;
    next(error);
  });
}

function deleteSingleTodo(req, res, next) {
  const user = req.user;
  const todoId = req.params.id;
  Todo.deleteSingle(todoId, user)
  .then(() => {
    res.status(204).end();
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

function getSingleTodo(req, res, next) {
  const user = req.user;
  const todoId = req.params.id;
  Todo.getSingle(todoId, user)
  .then(todoData => {
    res.status(200).json(todoData);
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

function getAllTodos(req, res, next) {
  const user = req.user;
  Todo.getAll(user)
  .then(todosData => {
    res.status(200).json(todosData);
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

function getActiveTodos(req, res, next) {
  const user = req.user;
  Todo.getActive(user)
  .then(todosData => {
    res.status(200).json(todosData);
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

function getCompletedTodos(req, res, next) {
  const user = req.user;
  Todo.getCompleted(user)
  .then(todosData => {
    res.status(200).json(todosData);
  })
  .catch(error => {
    error.status = error.status || 500;
    return next(error);
  });
}

router.post('/', requireTitleInBody, requireAuth, createSingleTodo);

router.patch('/:id', requireUUIDParam, requireJsonBody, requireAuth, editSingleTodo);

router.patch('/:id/toggleCompletion', requireUUIDParam, requireAuth, toggleSingleTodo);

router.delete('/:id', requireUUIDParam, requireAuth, deleteSingleTodo);

router.get('/all', requireAuth, getAllTodos);

router.get('/active', requireAuth, getActiveTodos);

router.get('/completed', requireAuth, getCompletedTodos);

router.get('/:id', requireUUIDParam, requireAuth, getSingleTodo);

module.exports = router;
