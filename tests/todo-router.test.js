/* global describe, it, context, before, after */
/* eslint-disable prefer-arrow-callback, func-names,
  space-before-function-paren, no-unused-expressions */
import { expect } from 'chai';
import axios from 'axios';
import { SERVER_URL } from '../config/app-config';
import { User, Todo } from '../models';
import { sampleUsersData } from './helpers';
const TODO_API = `${SERVER_URL}/api/todo`;

context('/api/todo', function() {
  let sampleUsers;
  let sampleTodos;
  const title = 'a new todo';
  const completed = false;
  before('populate fake data', function(done) {
    User.bulkCreate(sampleUsersData, { returning: true, individualHooks: true })
    .then(result => {
      sampleUsers = result;
      const sampleTodosData = [{
        title: 'buy milk',
        completed: false,
        ownerId: sampleUsers[0].id
      }, {
        title: 'get post',
        completed: false,
        ownerId: sampleUsers[0].id
      }, {
        title: 'play games',
        completed: true,
        ownerId: sampleUsers[0].id
      }, {
        title: 'clean room',
        completed: false,
        ownerId: sampleUsers[0].id
      }, {
        title: 'buy milk',
        completed: false,
        ownerId: sampleUsers[1].id
      }, {
        title: 'get post',
        completed: false,
        ownerId: sampleUsers[1].id
      }, {
        title: 'play games',
        completed: true,
        ownerId: sampleUsers[1].id
      }, {
        title: 'clean room',
        completed: false,
        ownerId: sampleUsers[1].id
      }];
      return Todo.bulkCreate(sampleTodosData, {
        returning: true,
        validate: true,
        individualHooks: true
      });
    })
    .then(result => {
      sampleTodos = result;
      done();
    })
    .catch(error => {
      done(error);
    });
  });

  describe('POST /', function() {
    context('with semantically incorrect data', function() {
      it('return 401 when token is invalid', function(done) {
        axios.post(`${TODO_API}/`,
          { title },
          { headers: { token: 'someinvalidtoken' } }
        )
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('return 401 when token is not present', function(done) {
        axios.post(`${TODO_API}/`,
          { title }
        )
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('return 403 when token user dose not have right to create todo', function(done) {
        axios.post(`${TODO_API}/`,
          { title },
          { headers: { token: sampleUsers[2].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });

      it('return 400 when unknown field is present request', function(done) {
        axios.post(`${TODO_API}/`,
          { title, unknownField: 'some content' },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(400);
          done();
        });
      });
    });

    context('with mal-formed request data', function() {
      it('return 422 when title is not present', function(done) {
        axios.post(`${TODO_API}/`,
          { completed },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('return 422 when title is an empty string', function(done) {
        axios.post(`${TODO_API}/`,
          { title: '', completed },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with correct request data', function() {
      let response;
      let user;
      let newTodo;
      before(function(done) {
        user = sampleUsers[0];
        axios.post(`${TODO_API}/`, {
          title,
          completed
        }, {
          headers: {
            token: user.getToken()
          }
        })
        .then(res => {
          response = res;
          done();
        })
        .catch(error => {
          done(error);
        });
      });

      it('create a new entry in database', function(done) {
        Todo.findById(response.data.id).then(todo => {
          newTodo = todo;
          expect(todo.title).to.equal(title);
          expect(todo.completed).to.equal(completed);
          expect(todo.ownerId).to.equal(user.id);
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('return 201 with todo selfie and owner publicSnapshot', function() {
        expect(response.status).to.equal(201);
        const todoData = newTodo.selfie();
        for (const key of Object.keys(todoData)) {
          expect(response.data[key]).to.deep.equal(todoData[key]);
        }
      });
    });
  });

  describe('PATCH /:id', function() {
    const newTitle = 'new title';
    const newCompleted = true;
    context('with semantically incorrect data', function() {
      it('return 401 when token is invalid', function(done) {
        axios.patch(`${TODO_API}/${sampleTodos[0].id}`,
          { title: newTitle },
          { headers: { token: 'someinvalidtoken' } }
        )
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('return 401 when token is not present', function(done) {
        axios.patch(`${TODO_API}/${sampleTodos[0].id}`, { title: newTitle })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('return 403 when token user is not the owner', function(done) {
        axios.patch(`${TODO_API}/${sampleTodos[0].id}`,
          { title: newTitle },
          { headers: { token: sampleUsers[1].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });

      it('return 412 when todo id does not exist', function(done) {
        axios.patch(`${TODO_API}/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`,
          { title: newTitle },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(412);
          done();
        });
      });

      it('return 400 when trying to modify unknown field', function(done) {
        axios.patch(`${TODO_API}/${sampleTodos[0].id}`,
          { title: newTitle, unknownField: 'some content' },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(400);
          done();
        });
      });

      it('return 400 when trying to modify un-editable field', function(done) {
        axios.patch(`${TODO_API}/${sampleTodos[0].id}`,
          { title: newTitle, ownerId: sampleUsers[1].id },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(400);
          done();
        });
      });
    });

    context('with mal-formed request data', function() {
      it('return 422 when data values contain empty string', function(done) {
        axios.patch(`${TODO_API}/${sampleTodos[0].id}`,
          { title: '' },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('return 422 when data is not present', function(done) {
        axios.patch(`${TODO_API}/${sampleTodos[0].id}`,
          { },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('return 422 when id is not a UUID', function(done) {
        axios.patch(`${TODO_API}/2313216545`,
          { title: newTitle },
          { headers: { token: sampleUsers[0].getToken() } }
        )
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with correct request data', function() {
      let patchingTodo;
      let owner;
      let response;
      let updatedTodo;
      const todoUpdates = {
        title: newTitle,
        completed: newCompleted
      };
      before(function(done) {
        patchingTodo = sampleTodos[0];
        owner = sampleUsers[0];
        axios.patch(`${TODO_API}/${patchingTodo.id}`,
          todoUpdates,
          { headers: { token: owner.getToken() } }
        )
        .then(res => {
          response = res;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('update the database with request data', function(done) {
        Todo.findById(patchingTodo.id)
        .then(todo => {
          updatedTodo = todo;
          for (const key of Object.keys(todoUpdates)) {
            expect(todoUpdates[key]).to.deep.equal(updatedTodo[key]);
          }
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('return 200 with todo selfie', function() {
        expect(response.status).to.equal(200);
        const todoData = updatedTodo.selfie();
        for (const key of Object.keys(todoData)) {
          expect(response.data[key]).to.deep.equal(todoData[key]);
        }
      });
    });
  });

  describe('DELETE /:id', function() {
    context('with mal-formed request data', function() {
      it('return 422 when id is not a UUID', function(done) {
        axios.delete(`${TODO_API}/12354654`, {
          headers: { token: sampleUsers[0].getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect data', function() {
      it('return 401 when token is invalid', function(done) {
        axios.delete(`${TODO_API}/${sampleTodos[0].id}`, {
          headers: { token: 'someinvalidtoken' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('return 401 when token is not present', function(done) {
        axios.delete(`${TODO_API}/${sampleTodos[0].id}`)
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('return 403 when token user is not the owner', function(done) {
        axios.delete(`${TODO_API}/${sampleTodos[0].id}`, {
          headers: { token: sampleUsers[1].getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });

      it('return 412 when todo id does not exist', function(done) {
        axios.delete(`${TODO_API}/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`, {
          headers: { token: sampleUsers[0].getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(412);
          done();
        });
      });
    });

    context('with correct request data', function() {
      let response;
      let todo;
      let user;
      before(function(done) {
        todo = sampleTodos[0];
        user = sampleUsers[0];
        axios.delete(`${TODO_API}/${todo.id}`, {
          headers: { token: user.getToken() }
        })
        .then(res => {
          response = res;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('delete todo in the database', function(done) {
        Todo.findById(todo.id)
        .then(deletedTodo => {
          expect(deletedTodo).to.be.null;
          done();
        })
        .catch(error => {
          done(error);
        });
      });

      it('return 204', function() {
        expect(response.status).to.equal(204);
      });
    });
  });

  describe('GET /:id', function() {
    context('with mal-formed request data', function() {
      it('return 422 when id is not a UUID', function(done) {
        axios.get(`${TODO_API}/1919}`, {
          headers: { token: 'invalid token' }
        })
        .catch(error => {
          expect(error.status).to.equal(422);
          done();
        });
      });
    });

    context('with correct request data', function() {
      it('return 200 with todo selfie', function(done) {
        const owner = sampleUsers[0];
        const todo = sampleTodos[1];
        axios.get(`${TODO_API}/${todo.id}`, {
          headers: { token: owner.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          const todoData = todo.selfie();
          for (const key of Object.keys(todoData)) {
            expect(todoData[key]).to.deep.equal(res.data[key]);
          }
          done();
        })
        .catch(error => {
          done(error);
        });
      });
    });

    context('with semantically incorrect data', function() {
      it('return 401 when token is invalid', function(done) {
        axios.get(`${TODO_API}/${sampleTodos[1].id}`, {
          headers: { token: 'invalid token' }
        })
        .catch(error => {
          expect(error.status).to.equal(401);
          done();
        });
      });

      it('return 401 when token is not present', function(done) {
        axios.get(`${TODO_API}/${sampleTodos[1].id}`)
        .catch(error => {
          expect(error.status).to.equal(401);
          done();
        });
      });

      it('return 403 when token user is not the owner', function(done) {
        axios.get(`${TODO_API}/${sampleTodos[1].id}`, {
          headers: { token: sampleUsers[1].getToken() }
        })
        .catch(error => {
          expect(error.status).to.equal(403);
          done();
        });
      });
    });
  });

  describe('GET /', function() {
    context('with semantically incorrect data', function() {
      it('return 401 when token is invalid', function(done) {
        axios.get(TODO_API, {
          headers: { token: 'someinvalidtoken' }
        })
        .catch(error => {
          expect(error.status).to.equal(401);
          done();
        });
      });

      it('return 401 when token is not present', function(done) {
        axios.get(TODO_API)
        .catch(error => {
          expect(error.status).to.equal(401);
          done();
        });
      });
    });

    context('with correct request data', function() {
      it('return 200 with token users todos selfies', function(done) {
        axios.get(TODO_API, {
          headers: { token: sampleUsers[1].getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.length).to.equal(4);
          done();
        })
        .catch(error => {
          done(error);
        });
      });
    });
  });

  after(function(done) {
    User.destroy({
      where: {
        email: {
          $like: '%@testmail.com%'
        }
      }
    })
    .then(() => {
      done();
    })
    .catch(err => {
      done(err);
    });
  });
});
