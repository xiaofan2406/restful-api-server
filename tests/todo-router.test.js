/* global describe, it, context, before, beforeEach, after, afterEach */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import axios from 'axios';
import { SERVER_URL } from '../config/app-config';
import { User, Todo } from '../models';
import { sampleUsersData } from './helpers';
const TODO_API = `${SERVER_URL}/api/todo`;

context('/api/todo', () => {
  let adminUser;
  let normalUser;
  let inavtiveUser;
  let noTodoUser;
  let sampleTodos;
  before('create sample users', done => {
    User.bulkCreate(sampleUsersData, { returning: true, individualHooks: true })
    .then(users => {
      normalUser = users[0];
      inavtiveUser = users[1];
      adminUser = users[2];
      noTodoUser = users[3];
      const sampleTodosData = [{
        title: 'buy milk',
        completed: false,
        ownerId: normalUser.id
      }, {
        title: 'get post',
        completed: false,
        ownerId: normalUser.id
      }, {
        title: 'play games',
        completed: true,
        ownerId: normalUser.id
      }, {
        title: 'clean room',
        completed: false,
        ownerId: normalUser.id
      }, {
        title: 'buy milk',
        completed: false,
        ownerId: adminUser.id
      }, {
        title: 'get post',
        completed: false,
        ownerId: adminUser.id
      }, {
        title: 'play games',
        completed: true,
        ownerId: adminUser.id
      }, {
        title: 'clean room',
        completed: false,
        ownerId: adminUser.id
      }];
      return Todo.bulkCreate(sampleTodosData, {
        returning: true,
        validate: true,
        individualHooks: true
      });
    })
    .then(result => {
      normalUser.todo = result.slice(0, 4);
      adminUser.todo = result.slice(4);
      sampleTodos = result;
      done();
    })
    .catch(err => {
      done(err);
    });
  });

  describe('POST /', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not preset', done => {
        axios.post(`${TODO_API}/`, {}, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when req.body contains unknown fields', done => {
        axios.post(`${TODO_API}/`, {
          title: 'Buy milk',
          unknown: 'field value'
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when title is not valid', done => {
        axios.post(`${TODO_API}/`, {
          content: 'milking is running out'
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.post(`${TODO_API}/`, {
          title: 'Buy milk'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is not valid', done => {
        axios.post(`${TODO_API}/`, {
          title: 'Buy milk'
        }, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when non-accessible field is present', done => {
        axios.post(`${TODO_API}/`, {
          title: 'Buy milk',
          id: 999
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 403 when token user has no permission to create todo', done => {
        axios.post(`${TODO_API}/`, {
          title: 'Buy milk'
        }, {
          headers: { token: noTodoUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 201 with todo selfie', done => {
        axios.post(`${TODO_API}/`, {
          title: 'Buy milk',
          completed: true,
          content: 'milk is running out',
          dueDate: new Date(),
          scope: 'Personal',
          scopeDate: new Date()
        }, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(201);
          expect(res.data.title).to.equal('Buy milk');
          expect(res.data.completed).to.be.true;
          expect(res.data.content).to.equal('milk is running out');
          expect(res.data.dueDate).to.exist;
          expect(res.data.scope).to.equal('Personal');
          expect(res.data.scopeDate).to.exist;
          expect(res.data.ownerId).to.equal(normalUser.id);
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('returns 201 with todo selfie and sets default values', done => {
        axios.post(`${TODO_API}/`, {
          title: 'Buy milk'
        }, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(201);
          expect(res.data.title).to.equal('Buy milk');
          expect(res.data.completed).to.be.false;
          expect(res.data.content).to.be.null;
          expect(res.data.dueDate).to.be.null;
          expect(res.data.scope).to.be.null;
          expect(res.data.scopeDate).to.be.null;
          expect(res.data.ownerId).to.equal(normalUser.id);
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('PATCH /:id', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${TODO_API}/${normalUser.todo[0].id}`, {}, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when req.body has invalid fields', done => {
        axios.patch(`${TODO_API}/${normalUser.todo[0].id}`, {
          title: 'Buy milk',
          content: [1, 2, 3]
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when req.body had unknown fields', done => {
        axios.patch(`${TODO_API}/${normalUser.todo[0].id}`, {
          title: 'Buy milk',
          unknown: 'fieldvalue'
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when id is not UUID format', done => {
        axios.patch(`${TODO_API}/9999`, {
          title: 'Buy milk'
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.patch(`${TODO_API}/${normalUser.todo[0].id}`, {
          title: 'Buy milk'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is invalid', done => {
        axios.patch(`${TODO_API}/${normalUser.todo[0].id}`, {
          title: 'Buy milk'
        }, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested todo does not exist', done => {
        axios.patch(`${TODO_API}/123e4567-e89b-12d3-a456-426655440000`, {
          title: 'Buy milk'
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(412);
          done();
        });
      });

      it('returns 403 when token user is not the owner', done => {
        axios.patch(`${TODO_API}/${normalUser.todo[0].id}`, {
          title: 'Buy milk'
        }, {
          headers: { token: adminUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });

      it('returns 403 when req.body contains un-editable field', done => {
        axios.patch(`${TODO_API}/${normalUser.todo[0].id}`, {
          title: 'Buy milk',
          id: '123e4567-e89b-12d3-a456-426655440000'
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with todo selfie', done => {
        axios.patch(`${TODO_API}/${normalUser.todo[0].id}`, {
          title: 'Buy milk',
          completed: true,
          content: 'milk is running out',
          dueDate: new Date(),
          scope: 'Personal',
          scopeDate: new Date()
        }, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.title).to.equal('Buy milk');
          expect(res.data.completed).to.be.true;
          expect(res.data.content).to.equal('milk is running out');
          expect(res.data.dueDate).to.exist;
          expect(res.data.scope).to.equal('Personal');
          expect(res.data.scopeDate).to.exist;
          expect(res.data.ownerId).to.equal(normalUser.id);
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('GET /:id', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when id is not UUID format', done => {
        axios.get(`${TODO_API}/9999`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.get(`${TODO_API}/${normalUser.todo[0].id}`)
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is invalid', done => {
        axios.get(`${TODO_API}/${normalUser.todo[0].id}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested todo does not exist', done => {
        axios.get(`${TODO_API}/123e4567-e89b-12d3-a456-426655440000`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(412);
          done();
        });
      });

      it('returns 403 when token user is not the owner', done => {
        axios.get(`${TODO_API}/${normalUser.todo[0].id}`, {
          headers: { token: adminUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with todo selfie', done => {
        axios.get(`${TODO_API}/${normalUser.todo[1].id}`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.title).to.equal('get post');
          expect(res.data.completed).to.be.false;
          expect(res.data.content).to.be.null;
          expect(res.data.dueDate).to.be.null;
          expect(res.data.scope).to.be.null;
          expect(res.data.scopeDate).to.be.null;
          expect(res.data.ownerId).to.equal(normalUser.id);
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('GET /', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.get(`${TODO_API}/`)
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is invalid', done => {
        axios.get(`${TODO_API}/`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with todo selfies', done => {
        axios.get(`${TODO_API}/`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data).to.be.instanceof(Array);
          for (const todo of res.data) {
            expect(todo).to.have.property('title');
            expect(todo).to.have.property('content');
            expect(todo).to.have.property('dueDate');
            expect(todo).to.have.property('completed');
            expect(todo).to.have.property('scope');
            expect(todo).to.have.property('scopeDate');
            expect(todo.ownerId).to.equal(normalUser.id);
          }
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('GET /active', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.get(`${TODO_API}/active`)
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is invalid', done => {
        axios.get(`${TODO_API}/active`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with todo selfies', done => {
        axios.get(`${TODO_API}/active`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data).to.be.instanceof(Array);
          for (const todo of res.data) {
            expect(todo).to.have.property('title');
            expect(todo).to.have.property('content');
            expect(todo).to.have.property('dueDate');
            expect(todo).to.have.property('scope');
            expect(todo).to.have.property('scopeDate');
            expect(todo.completed).to.be.false;
            expect(todo.ownerId).to.equal(normalUser.id);
          }
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('GET /completed', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.get(`${TODO_API}/completed`)
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is invalid', done => {
        axios.get(`${TODO_API}/completed`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with todo selfies', done => {
        axios.get(`${TODO_API}/completed`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data).to.be.instanceof(Array);
          for (const todo of res.data) {
            expect(todo).to.have.property('title');
            expect(todo).to.have.property('content');
            expect(todo).to.have.property('dueDate');
            expect(todo).to.have.property('scope');
            expect(todo).to.have.property('scopeDate');
            expect(todo.completed).to.be.true;
            expect(todo.ownerId).to.equal(normalUser.id);
          }
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('DELETE /:id', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when id is not UUID format', done => {
        axios.delete(`${TODO_API}/9999`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.delete(`${TODO_API}/${normalUser.todo[0].id}`)
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is invalid', done => {
        axios.delete(`${TODO_API}/${normalUser.todo[0].id}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested todo does not exist', done => {
        axios.delete(`${TODO_API}/123e4567-e89b-12d3-a456-426655440000`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(412);
          done();
        });
      });

      it('returns 403 when token user is not the owner', done => {
        axios.delete(`${TODO_API}/${adminUser.todo[0].id}`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 204 with no data', done => {
        axios.delete(`${TODO_API}/${normalUser.todo[0].id}`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(204);
          expect(res.data).to.be.empty;
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  after('clean up sample entries', done => {
    User.destroy({
      where: {
        email: {
          $like: '%@testmail.com%'
        }
      },
      force: true
    })
    .then(() => {
      done();
    })
    .catch(err => {
      done(err);
    });
  });
});
