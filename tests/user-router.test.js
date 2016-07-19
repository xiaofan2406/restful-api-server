/* global describe, it, context, before, beforeEach, after, afterEach */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import axios from 'axios';
import { SERVER_URL } from '../config/app-config';
import { User } from '../models';
import { type as userType } from '../constants/user-constants.js';
const USER_API = `${SERVER_URL}/api/user`;
import { sampleUsersData, isDateEqual } from './helpers';

context('/api/user', () => {
  let adminUser;
  let normalUser;
  let inactiveUser;
  before('create sample users', done => {
    User.bulkCreate(sampleUsersData, { returning: true, individualHooks: true })
    .then(users => {
      normalUser = users[0];
      inactiveUser = users[1];
      adminUser = users[2];
      done();
    })
    .catch(err => {
      done(err);
    });
  });

  describe('POST /', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not presnet', done => {
        axios.post(`${USER_API}/`)
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is not present in req.body', done => {
        axios.post(`${USER_API}/`, { password: 'password1' })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.post(`${USER_API}/`, { email: 'invalidemail', password: 'password1' })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is not present in req.body', done => {
        axios.post(`${USER_API}/`, { email: 'valid@testmail.com' })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is invalid', done => {
        axios.post(`${USER_API}/`, { email: 'valid@testmail.com', password: 'pass' })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when unknown fields in req.body', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@testmail.com',
          password: 'password1',
          unknown: 'fieldvalue'
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is in header but not valid', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@testmail.com',
          password: 'password1'
        }, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but user is not activated', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@testmail.com',
          password: 'password1'
        }, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w. normal token user', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@testmail.com',
          password: 'password1',
          type: userType.EDITOR
        }, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w.o token', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@testmail.com',
          password: 'password1',
          activated: true
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });

      it('returns 409 when creating duplicate user email', done => {
        axios.post(`${USER_API}/`, {
          email: normalUser.email,
          password: 'password1'
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when creating duplicate user email case insensitive', done => {
        axios.post(`${USER_API}/`, {
          email: normalUser.email.toUpperCase(),
          password: 'password1'
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when creating duplicate username case insensitive', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@testmail.com',
          username: normalUser.username.toUpperCase(),
          password: 'password1'
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('when no token is not present', () => {
        it('returns 202 and default username with user publicInfo', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1'
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.username).to.equal('valid@testmail.com');
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 202 and given username with user publicInfo', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1',
            username: 'myname'
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.username).to.equal('myname');
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        afterEach('remove created user', done => {
          User.destroy({
            where: {
              email: 'valid@testmail.com'
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

      describe('when token user is normal', () => {
        it('returns 202 and default username with user publicInfo', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1'
          }, {
            headers: { token: normalUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.username).to.equal('valid@testmail.com');
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 202 and given username with user publicInfo', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1',
            username: 'myname'
          }, {
            headers: { token: normalUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.username).to.equal('myname');
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        afterEach('remove created user', done => {
          User.destroy({
            where: {
              email: 'valid@testmail.com'
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

      describe('when token user is adminUser', () => {
        it('returns 201 with user selfie when activated is set to true', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1',
            activated: true
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(201);
            expect(res.data.email).to.equal('valid@testmail.com');
            expect(res.data.username).to.equal('valid@testmail.com');
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 202 with user selfie when activated is not specified', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.email).to.equal('valid@testmail.com');
            expect(res.data.username).to.equal('valid@testmail.com');
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('sets the correct username when given', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1',
            username: 'myname'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.email).to.equal('valid@testmail.com');
            expect(res.data.username).to.equal('myname');
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('sets the correct type when given', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1',
            username: 'myname',
            type: userType.EDITOR
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.email).to.equal('valid@testmail.com');
            expect(res.data.username).to.equal('myname');
            expect(res.data.type).to.equal(userType.EDITOR);
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns dates information', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@testmail.com',
            password: 'password1',
            username: 'myname'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        afterEach('remove created user', done => {
          User.destroy({
            where: {
              email: 'valid@testmail.com'
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
    });
  });

  describe('POST /getToken', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.post(`${USER_API}/getToken`)
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is not present in req.body', done => {
        axios.post(`${USER_API}/getToken`, {
          password: 'normal1password'
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.post(`${USER_API}/getToken`, {
          email: 'invalidemail',
          password: 'normal1password'
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is not present in req.body', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser.email
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is invalid', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser.email,
          password: 'pass'
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when email is not registered', done => {
        axios.post(`${USER_API}/getToken`, {
          email: 'notregistered@mail.com',
          password: 'password1'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email and password do not match', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser.email,
          password: 'notnormal1password'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email account is not activated', done => {
        axios.post(`${USER_API}/getToken`, {
          email: inactiveUser.email,
          password: 'notactivatepassword1'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with user selfie and token', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser.email,
          password: 'normalpassword1'
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(normalUser.email);
          expect(res.data.username).to.equal(normalUser.username);
          expect(res.data.type).to.equal(userType.NORMAL);
          expect(res.data.activated).to.be.true;
          const createdAt = new Date(res.data.createdAt);
          const updatedAt = new Date(res.data.updatedAt);
          expect(isDateEqual(new Date(), createdAt)).to.be.true;
          expect(isDateEqual(new Date(), updatedAt)).to.be.true;
          expect(res.data.token).to.exist;
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('PATCH /activateAccount', () => {
    let tempUser;
    before('create temp user', done => {
      User.create({
        email: 'tempuser@testmail.com',
        username: 'tempuser@testmail.com',
        password: 'password1',
        activated: false
      })
      .then(user => {
        tempUser = user;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/activateAccount`)
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is not present in req.body', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          uniqueId: tempUser.uniqueId
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: 'invalidemail',
          uniqueId: tempUser.uniqueId
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is not present in req.body', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: tempUser.email
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is invalid', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: tempUser.email,
          uniqueId: 'not uuid format'
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when email and uniqueId do not match', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: tempUser.email,
          uniqueId: adminUser.uniqueId
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email is not registered', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: 'notregistered@mail.com',
          uniqueId: tempUser.uniqueId
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 409 when email account was already activated', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normalUser.email,
          uniqueId: normalUser.uniqueId
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('when user was valid', () => {
        it('returns 200 with user selfie', done => {
          axios.patch(`${USER_API}/activateAccount`, {
            email: tempUser.email,
            uniqueId: tempUser.uniqueId
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(tempUser.email);
            expect(res.data.username).to.equal(tempUser.username);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            expect(res.data.token).to.exist;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('when user was deleted', () => {
        before('remove user', done => {
          User.destroy({
            where: { id: tempUser.id },
            individualHooks: true
          })
          .then(() => {
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user selfie and sets user valid', done => {
          axios.patch(`${USER_API}/activateAccount`, {
            email: tempUser.email,
            uniqueId: tempUser.uniqueId
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(tempUser.email);
            expect(res.data.username).to.equal(tempUser.username);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            expect(res.data.token).to.exist;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });
    });

    after('remove temp user', done => {
      User.destroy({
        where: { id: tempUser.id },
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

  describe('PATCH /resetPassword', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/resetPassword`)
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is not present in req.body', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          password: 'newpassword2016',
          uniqueId: normalUser.uniqueId
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: 'invalidemail',
          password: 'newpassword2016',
          uniqueId: normalUser.uniqueId
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is not present in req.body', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser.email,
          password: 'newpassword2016'
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is invalid', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser.email,
          password: 'newpassword2016',
          uniqueId: 'not uuid format'
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is not present in req.body', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser.email,
          uniqueId: normalUser.uniqueId
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is invalid', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser.email,
          uniqueId: normalUser.uniqueId,
          password: 'pass'
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when email and uniqueId do not match', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser.email,
          uniqueId: adminUser.uniqueId,
          password: 'newpassword2016'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email is not registered', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: 'notregistered@mail.com',
          uniqueId: normalUser.uniqueId,
          password: 'newpassword2016'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 204 with no data', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser.email,
          uniqueId: normalUser.uniqueId,
          password: 'newpassword2016'
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

  describe('PATCH /:id', () => {
    let tempUser;
    before('create temp user', done => {
      User.create({
        email: 'tempuser@testmail.com',
        username: 'tempuser@testmail.com',
        password: 'password1',
        activated: true
      })
      .then(user => {
        tempUser = user;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/${tempUser.id}`)
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when body contains unknown fields', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          unknown: 'fieldvalue'
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email in req.body is invalid', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          email: 'invalidemail'
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password in req.body is invalid', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          password: 'pass'
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when username in req.body is invalid', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          username: 'na'
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          email: 'newemail@testmail.com'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but not valid', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          email: 'newemail@testmail.com'
        }, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but user is not activated', done => {
        axios.patch(`${USER_API}/${inactiveUser.id}`, {
          email: 'newemail@testmail.com'
        }, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w. normal token user', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          email: 'newemail@testmail.com',
          type: userType.EDITOR
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });

      it('returns 409 when changing email to an existing email', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          email: adminUser.email
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when changing email to an existing email case insensitive', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          email: adminUser.email.toUpperCase()
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when changing username to an existing username', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          username: adminUser.username
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when changing username to an existing username case insensitive', done => {
        axios.patch(`${USER_API}/${tempUser.id}`, {
          username: adminUser.username.toUpperCase()
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('when token user is normal', () => {
        it('returns 200 with user selfie and updates correct fields', done => {
          axios.patch(`${USER_API}/${tempUser.id}`, {
            username: 'somename'
          }, {
            headers: { token: tempUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('somename');
            expect(res.data.email).to.equal(tempUser.email);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('when token user is adminUser', () => {
        it('returns 200 with user selfie and update correct fields', done => {
          axios.patch(`${USER_API}/${tempUser.id}`, {
            username: 'someothername'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('someothername');
            expect(res.data.email).to.equal(tempUser.email);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user selfie and update adminUser fields', done => {
          axios.patch(`${USER_API}/${tempUser.id}`, {
            email: 'normal2newemail@testmail.com',
            type: userType.EDITOR,
            activated: false
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('someothername');
            expect(res.data.email).to.equal('normal2newemail@testmail.com');
            expect(res.data.type).to.equal(userType.EDITOR);
            expect(res.data.activated).to.be.false;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });
    });

    after('remove temp user', done => {
      User.destroy({
        where: { id: tempUser.id },
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

  describe('PATCH /:username', () => {
    let tempUser;
    before('create temp user', done => {
      User.create({
        email: 'tempuser@testmail.com',
        username: 'tempuser@testmail.com',
        password: 'password1',
        activated: true
      })
      .then(user => {
        tempUser = user;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/${tempUser.username}`)
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when body contains unknown fields', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          unknown: 'fieldvalue'
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email in req.body is invalid', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          email: 'invalidemail'
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password in req.body is invalid', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          password: 'pass'
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when username in req.body is invalid', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          username: 'na'
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          email: 'newemai2@testmail.com'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but not valid', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          email: 'newemail2@testmail.com'
        }, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but user is not activated', done => {
        axios.patch(`${USER_API}/${inactiveUser.username}`, {
          email: 'newemail@testmail.com'
        }, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w. normal token user', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          email: 'newemail2@testmail.com',
          type: userType.EDITOR
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });

      it('returns 409 when changing email to an existing email', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          email: adminUser.email
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when changing email to an existing email case insensitive', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          email: adminUser.email.toUpperCase()
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when changing username to an existing username', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          username: adminUser.username
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when changing username to an existing username case insensitive', done => {
        axios.patch(`${USER_API}/${tempUser.username}`, {
          username: adminUser.username.toUpperCase()
        }, {
          headers: { token: tempUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('when token user is normal', () => {
        it('returns 200 with user selfie and update correct fields', done => {
          axios.patch(`${USER_API}/${tempUser.username}`, {
            username: 'anewname'
          }, {
            headers: { token: tempUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('anewname');
            expect(res.data.email).to.equal(tempUser.email);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('when token user is adminUser', () => {
        beforeEach('reset username', done => {
          User.update({ username: tempUser.username }, { where: { id: tempUser.id } })
          .then(() => {
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user selfie and update correct fields', done => {
          axios.patch(`${USER_API}/${tempUser.username}`, {
            username: 'Normalname'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('Normalname');
            expect(res.data.email).to.equal(tempUser.email);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user selfie and update adminUser fields', done => {
          axios.patch(`${USER_API}/${tempUser.username}`, {
            username: 'NormalnewName',
            email: 'newnormalemail@testmail.com',
            type: userType.EDITOR,
            activated: false
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NormalnewName');
            expect(res.data.email).to.equal('newnormalemail@testmail.com');
            expect(res.data.type).to.equal(userType.EDITOR);
            expect(res.data.activated).to.be.false;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });
    });

    after('remove temp user', done => {
      User.destroy({
        where: { id: tempUser.id },
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

  describe('GET /checkEmail', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.query is not present', done => {
        axios.get(`${USER_API}/checkEmail`)
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email in req.query is invalid', done => {
        axios.get(`${USER_API}/checkEmail?email=invalidemail`)
        .catch(err => {
          expect(err.response.status).to.equal(422);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('return 200 with isRegistered true when email is registered', done => {
        axios.get(`${USER_API}/checkEmail?email=${normalUser.email}`)
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.isRegistered).to.be.true;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('return 200 with isRegistered false when email is not registered', done => {
        axios.get(`${USER_API}/checkEmail?email=notregistered@mail.com`)
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.isRegistered).to.be.false;
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('GET /refreshToken', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: {}
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is invalid', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('return 200 with user selfie and token', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(normalUser.email);
          expect(res.data.username).to.equal(normalUser.username);
          expect(res.data.type).to.equal(userType.NORMAL);
          expect(res.data.activated).to.be.true;
          const createdAt = new Date(res.data.createdAt);
          const updatedAt = new Date(res.data.updatedAt);
          expect(isDateEqual(new Date(), createdAt)).to.be.true;
          expect(isDateEqual(new Date(), updatedAt)).to.be.true;
          expect(res.data.token).to.exist;
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('GET /:id', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is invalid', done => {
        axios.get(`${USER_API}/${normalUser.id}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/${normalUser.id}`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested user does not exist', done => {
        axios.get(`${USER_API}/99999999`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(412);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('with no token', () => {
        it('returns 200 with user publicInfo', done => {
          axios.get(`${USER_API}/${adminUser.id}`)
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.not.exist;
            expect(res.data.username).to.equal(adminUser.username);
            expect(res.data.type).to.not.exist;
            expect(res.data.activated).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('with normal token user', () => {
        it('returns 200 with user selfie when token user is requested user', done => {
          axios.get(`${USER_API}/${normalUser.id}`, {
            headers: { token: normalUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser.email);
            expect(res.data.username).to.equal(normalUser.username);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user publicInfo when token user is not requested user', done => {
          axios.get(`${USER_API}/${adminUser.id}`, {
            headers: { token: normalUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.not.exist;
            expect(res.data.username).to.equal(adminUser.username);
            expect(res.data.type).to.not.exist;
            expect(res.data.activated).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('with adminUser token user', () => {
        it('returns 200 with user selfie when token user is requested user', done => {
          axios.get(`${USER_API}/${adminUser.id}`, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(adminUser.email);
            expect(res.data.username).to.equal(adminUser.username);
            expect(res.data.type).to.equal(userType.ADMIN);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user selfie when token user is not requested user', done => {
          axios.get(`${USER_API}/${normalUser.id}`, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser.email);
            expect(res.data.username).to.equal(normalUser.username);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });
    });
  });

  describe('GET /:username', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is invalid', done => {
        axios.get(`${USER_API}/${normalUser.username}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/${normalUser.username}`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested user does not exist', done => {
        axios.get(`${USER_API}/99999999`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(412);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('with no token', () => {
        it('returns 200 with user publicInfo', done => {
          axios.get(`${USER_API}/${adminUser.username}`)
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.not.exist;
            expect(res.data.username).to.equal(adminUser.username);
            expect(res.data.type).to.not.exist;
            expect(res.data.activated).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('with normal token user', () => {
        it('returns 200 with user selfie when token user is requested user', done => {
          axios.get(`${USER_API}/${normalUser.username}`, {
            headers: { token: normalUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser.email);
            expect(res.data.username).to.equal(normalUser.username);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user publicInfo when token user is not requested user', done => {
          axios.get(`${USER_API}/${adminUser.username}`, {
            headers: { token: normalUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.not.exist;
            expect(res.data.username).to.equal(adminUser.username);
            expect(res.data.type).to.not.exist;
            expect(res.data.activated).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('with adminUser token user', () => {
        it('returns 200 with user selfie when token user is requested user', done => {
          axios.get(`${USER_API}/${adminUser.username}`, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(adminUser.email);
            expect(res.data.username).to.equal(adminUser.username);
            expect(res.data.type).to.equal(userType.ADMIN);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user selfie when token user is not requested user', done => {
          axios.get(`${USER_API}/${normalUser.username}`, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser.email);
            expect(res.data.username).to.equal(normalUser.username);
            expect(res.data.type).to.equal(userType.NORMAL);
            expect(res.data.activated).to.be.true;
            const createdAt = new Date(res.data.createdAt);
            const updatedAt = new Date(res.data.updatedAt);
            expect(isDateEqual(new Date(), createdAt)).to.be.true;
            expect(isDateEqual(new Date(), updatedAt)).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });
    });
  });

  describe('GET /', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not valid', done => {
        axios.get(`${USER_API}/`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with users publicInfos when no token is present', done => {
        axios.get(`${USER_API}/`)
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data).to.be.instanceof(Array);
          for (const user of res.data) {
            expect(user.username).to.exist;
            expect(user.activated).to.exist;
            expect(user.email).to.not.exist;
            expect(user.type).to.not.exist;
            expect(user.createdAt).to.not.exist;
            expect(user.updatedAt).to.not.exist;
          }
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('returns 200 with users publicInfos when token user is normal', done => {
        axios.get(`${USER_API}/`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data).to.be.instanceof(Array);
          for (const user of res.data) {
            expect(user.username).to.exist;
            expect(user.activated).to.exist;
            expect(user.email).to.not.exist;
            expect(user.type).to.not.exist;
            expect(user.createdAt).to.not.exist;
            expect(user.updatedAt).to.not.exist;
          }
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('returns 200 with users selfies when token user is adminUser', done => {
        axios.get(`${USER_API}/`, {
          headers: { token: adminUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data).to.be.instanceof(Array);
          for (const user of res.data) {
            expect(user.username).to.exist;
            expect(user.activated).to.exist;
            expect(user.email).to.exist;
            expect(user.type).to.exist;
            expect(user.createdAt).to.exist;
            expect(user.updatedAt).to.exist;
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
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.delete(`${USER_API}/${normalUser.id}`, {
          headers: { }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is not valid', done => {
        axios.delete(`${USER_API}/${normalUser.id}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.delete(`${USER_API}/${inactiveUser.id}`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when token user is not requested user', done => {
        axios.delete(`${USER_API}/${inactiveUser.id}`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with activated status when token user is normal', done => {
        axios.delete(`${USER_API}/${normalUser.id}`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.activated).to.be.false;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('returns 200 with user selfie when token user is adminUser', done => {
        axios.delete(`${USER_API}/${inactiveUser.id}`, {
          headers: { token: adminUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(inactiveUser.email);
          expect(res.data.username).to.equal(inactiveUser.username);
          expect(res.data.type).to.equal(userType.NORMAL);
          expect(res.data.activated).to.be.false;
          const createdAt = new Date(res.data.createdAt);
          const updatedAt = new Date(res.data.updatedAt);
          const deletedAt = new Date(res.data.deletedAt);
          expect(isDateEqual(new Date(), createdAt)).to.be.true;
          expect(isDateEqual(new Date(), updatedAt)).to.be.true;
          expect(isDateEqual(new Date(), deletedAt)).to.be.true;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('makes the email remains registered', done => {
        axios.get(`${USER_API}/checkEmail?email=${normalUser.email}`)
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.isRegistered).to.be.true;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('disables the getToken for deleted user', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser.email,
          password: 'normal1password'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('disables the refreshToken for deleted user', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });

    after('restore users', done => {
      User.restore({
        where: { id: normalUser.id }
      })
      .then(() => {
        return User.restore({
          where: { id: inactiveUser.id }
        });
      })
      .then(() => {
        return User.update({ activated: true }, { where: { id: normalUser.id } });
      })
      .then(() => {
        done();
      })
      .catch(err => {
        done(err);
      });
    });
  });

  describe('DELETE /:username', () => {
    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.delete(`${USER_API}/${normalUser.username}`, {
          headers: { }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is not valid', done => {
        axios.delete(`${USER_API}/${normalUser.username}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.delete(`${USER_API}/${inactiveUser.username}`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when token user is not requested user', done => {
        axios.delete(`${USER_API}/${inactiveUser.username}`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(403);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with activated status when token user is normal', done => {
        axios.delete(`${USER_API}/${normalUser.username}`, {
          headers: { token: normalUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.activated).to.be.false;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('returns 200 with user selfie when token user is adminUser', done => {
        axios.delete(`${USER_API}/${inactiveUser.username}`, {
          headers: { token: adminUser.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(inactiveUser.email);
          expect(res.data.username).to.equal(inactiveUser.username);
          expect(res.data.type).to.equal(userType.NORMAL);
          expect(res.data.activated).to.be.false;
          const createdAt = new Date(res.data.createdAt);
          const updatedAt = new Date(res.data.updatedAt);
          const deletedAt = new Date(res.data.deletedAt);
          expect(isDateEqual(new Date(), createdAt)).to.be.true;
          expect(isDateEqual(new Date(), updatedAt)).to.be.true;
          expect(isDateEqual(new Date(), deletedAt)).to.be.true;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('makes the email remails registered', done => {
        axios.get(`${USER_API}/checkEmail?email=${normalUser.email}`)
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.isRegistered).to.be.true;
          done();
        })
        .catch(err => {
          done(err);
        });
      });

      it('disables the getToken for deleted user', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser.email,
          password: 'normal1password'
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });

      it('disables the refreshToken for deleted user', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: normalUser.getToken() }
        })
        .catch(err => {
          expect(err.response.status).to.equal(401);
          done();
        });
      });
    });
  });

  after('clean up sample users', done => {
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
