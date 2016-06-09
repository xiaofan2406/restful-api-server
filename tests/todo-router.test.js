const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const { User, Todo } = require('../models');
const { SERVER_URL } = require('../config/app-config');
const TODO_API = `${SERVER_URL}/api/todo`;

const { sampleUsersData } = require('./helpers');
// TODO edge cases?

context('/api/todo', function() {

let sampleUsers, sampleTodos;
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
    }]
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

    it('return 403 when token user dose not have right to create todo', function() {
      axios.post(`${TODO_API}/`,
        { title },
        { headers: { token: sampleUsers[2].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });

    it('return 400 when unknown field is present request', function() {
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
    let response, user, newTodo;
    before(function(done) {
      user = sampleUsers[0];
      axios.post(`${TODO_API}/`,  {
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
      for(let key in todoData) {
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
    let patchingTodo, owner, response, updatedTodo;
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
        for (const key in todoUpdates) {
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
      for(let key in todoData) {
        expect(response.data[key]).to.deep.equal(todoData[key]);
      }
    });
  });
});

describe('PATCH /:id/toggleCompletion', function() {
  context('with mal-formed request data', function() {
    it('return 422 when id is not a UUID', function(done) {
      axios.patch(`${TODO_API}/123321321/toggleCompletion`, {}, {
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
      axios.patch(`${TODO_API}/${sampleTodos[0].id}/toggleCompletion`, {}, {
        headers: { token: 'someinvalidtoken' }
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 401 when token is not present', function(done) {
      axios.patch(`${TODO_API}/${sampleTodos[0].id}/toggleCompletion`, {})
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('retunr 403 when token user is not the owner', function(done) {
      axios.patch(`${TODO_API}/${sampleTodos[0].id}/toggleCompletion`, {}, {
        headers: { token: sampleUsers[1].getToken() }
      })
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });
  });

  context('with correct request data', function() {
    let beforeToggle;
    let afterToggle;
    before(function(done) {
      beforeToggle = sampleTodos[2];
      axios.patch(`${TODO_API}/${beforeToggle.id}/toggleCompletion`, {}, {
        headers: { token: sampleUsers[0].getToken() }
      })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('updates the completed field in database', function(done) {
      Todo.findById(beforeToggle.id).then(todo => {
        afterToggle = todo;
        expect(todo.completed).to.not.equal(beforeToggle.completed);
        expect(todo.title).to.equal(beforeToggle.title);
        done();
      }).catch(err => {
        done(err);
      })
    });
    it('return 200 with todo selfie', function(){
      expect(response.status).to.equal(200);
      const todoData = afterToggle.selfie();
      for(let key in todoData) {
        expect(response.data[key]).to.deep.equal(todoData[key]);
      }
    });
  })
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
    let response, todo, user;
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
      .then(todo => {
        expect(todo).to.be.null;
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
        for(let key in todoData) {
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
  }).then(res => {
    done();
  }).catch(err => {
    done(err);
  });
});
});
