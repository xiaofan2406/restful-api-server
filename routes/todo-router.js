import express from 'express';
import requireAuth from '../helpers/passport-jwt';
import Validator from '../helpers/validator-mdw';
import { Todo } from '../models';

const router = express.Router();
const todoFieldsValidator = Validator(Todo.fieldsValidator());

function createTodo(req, res, next) {
  const todoData = req.body;
  const httpUser = req.user;
  Todo.createSingle(todoData, httpUser)
  .then(todo => {
    res.status(201).json(todo.selfie());
  })
  .catch(error => {
    next(error);
  });
}

function editTodo(req, res, next) {
  const httpUser = req.user;
  const todoId = req.params.id;
  const updates = req.body;
  Todo.editSingle(todoId, updates, httpUser)
  .then(updatedTodo => {
    res.status(200).json(updatedTodo.selfie());
  })
  .catch(error => {
    next(error);
  });
}

function deleteTodo(req, res, next) {
  const httpUser = req.user;
  const todoId = req.params.id;
  Todo.deleteSingle(todoId, httpUser)
  .then(() => {
    res.status(204).end();
  })
  .catch(error => {
    next(error);
  });
}

function getTodo(req, res, next) {
  const httpUser = req.user;
  const todoId = req.params.id;
  Todo.getSingle(todoId, httpUser)
  .then(todoData => {
    res.status(200).json(todoData);
  })
  .catch(error => {
    next(error);
  });
}

function getTodos(filter = null) {
  return (req, res, next) => {
    const httpUser = req.user;
    Todo.getAll(filter, httpUser)
    .then(todosData => {
      res.status(200).json(todosData);
    })
    .catch(error => {
      next(error);
    });
  };
}


router.post('/', todoFieldsValidator('body', ['title']),
  requireAuth, createTodo);

router.patch('/:id', todoFieldsValidator('params', ['id']), todoFieldsValidator('body'),
  requireAuth, editTodo);

router.delete('/:id', todoFieldsValidator('params', ['id']),
  requireAuth, deleteTodo);

router.get('/active', requireAuth, getTodos({ completed: false }));

router.get('/completed', requireAuth, getTodos({ completed: true }));

router.get('/:id', todoFieldsValidator('params', ['id']),
  requireAuth, getTodo);

router.get('/', requireAuth, getTodos());


export default router;
