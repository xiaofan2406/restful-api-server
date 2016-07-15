/* global describe, it, context, before, beforeEach, after, afterEach */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import axios from 'axios';
import { SERVER_URL } from '../config/app-config';
import { User, Todo } from '../models';
import { sampleUsersData } from './helpers';
const TODO_API = `${SERVER_URL}/api/todo`;

context('/api/todo', () => {
  let admin;
  let normal1;
  let normal2;
  let inavtiveUser;
  let sampleTodos;
  before('create sample users', done => {
    User.bulkCreate(sampleUsersData, { returning: true, individualHooks: true })
    .then(users => {
      normal1 = users[0];
      normal2 = users[4];
      inavtiveUser = users[2];
      admin = users[3];
      const sampleTodosData = [{
        title: 'buy milk',
        completed: false,
        ownerId: normal1.id
      }, {
        title: 'get post',
        completed: false,
        ownerId: normal1.id
      }, {
        title: 'play games',
        completed: true,
        ownerId: normal1.id
      }, {
        title: 'clean room',
        completed: false,
        ownerId: normal1.id
      }, {
        title: 'buy milk',
        completed: false,
        ownerId: normal2.id
      }, {
        title: 'get post',
        completed: false,
        ownerId: normal2.id
      }, {
        title: 'play games',
        completed: true,
        ownerId: normal2.id
      }, {
        title: 'clean room',
        completed: false,
        ownerId: normal2.id
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
    .catch(err => {
      done(err);
    });
  });

  describe('POST /', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not preset');

      it('returns 422 when req.body contains unknown fields');

      it('returns 422 when title is not valid');
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present');

      it('returns 401 when token is not valid');

      it('returns 401 when token user has no permission to create todo');
    });

    context('with valid request data', () => {
      it('returns 201 with todo selfie');
    });
  });

  describe('PATCH /:id', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present');

      it('returns 422 when req.body has invalid fields');

      it('returns 422 when req.body had unknown fields');

      it('returns 422 when id is not UUID format');
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when toekn is not present');

      it('returns 401 when token is invalid');

      it('returns 412 when requested todo does not exist');

      it('returns 401 when token user is not the owner');

      it('returns 403 when req.body contains un-editable field');
    });

    context('with valid request data', () => {
      it('returns 200 with todo selfie');
    });
  });

  describe('DELETE /:id', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when id is not UUID format');
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when toekn is not present');

      it('returns 401 when token is invalid');

      it('returns 412 when requested todo does not exist');

      it('returns 401 when token user is not the owner');
    });

    context('with valid request data', () => {
      it('returns 204 with no data');
    });
  });

  describe('GET /:id', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when id is not UUID format');
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when toekn is not present');

      it('returns 401 when token is invalid');

      it('returns 412 when requested todo does not exist');

      it('returns 401 when token user is not the owner');
    });

    context('with valid request data', () => {
      it('returns 200 with todo selfie');
    });
  });

  describe('GET /', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when toekn is not present');

      it('returns 401 when token is invalid');
    });

    context('with valid request data', () => {
      it('returns 200 with todo selfies');
    });
  });

  describe('GET /active', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when toekn is not present');

      it('returns 401 when token is invalid');
    });

    context('with valid request data', () => {
      it('returns 200 with active todo selfies');
    });
  });

  describe('GET /active', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when toekn is not present');

      it('returns 401 when token is invalid');
    });

    context('with valid request data', () => {
      it('returns 200 with completed todo selfies');
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
