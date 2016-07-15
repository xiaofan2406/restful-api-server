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
  let normalUser1;
  let normalUser2;
  let normalUser3;
  let inactiveUser;
  before('create sample users', done => {
    User.bulkCreate(sampleUsersData, { returning: true, individualHooks: true })
    .then(users => {
      normalUser1 = users[0];
      normalUser2 = users[1];
      inactiveUser = users[2];
      adminUser = users[3];
      normalUser3 = users[4];
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
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is not present in req.body', done => {
        axios.post(`${USER_API}/`, { password: 'password1' })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.post(`${USER_API}/`, { email: 'invalidemail', password: 'password1' })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is not present in req.body', done => {
        axios.post(`${USER_API}/`, { email: 'valid@email.com' })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is invalid', done => {
        axios.post(`${USER_API}/`, { email: 'valid@email.com', password: 'pass' })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when unknown fields in req.body', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@email.com',
          password: 'password1',
          unknown: 'fieldvalue'
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is in header but not valid', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@email.com',
          password: 'password1'
        }, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but user is not activated', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@email.com',
          password: 'password1'
        }, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w. normal token user', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@email.com',
          password: 'password1',
          type: userType.EDITOR
        }, {
          headers: { token: normalUser1.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w.o token', done => {
        axios.post(`${USER_API}/`, {
          email: 'valid@email.com',
          password: 'password1',
          activated: true
        })
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });

      it('returns 409 when trying to create duplicate user', done => {
        axios.post(`${USER_API}/`, {
          email: normalUser1.email,
          password: 'password1'
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('when no token is not present', () => {
        it('returns 202 and default username with user publicInfo', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@email.com',
            password: 'password1'
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.username).to.equal('valid@email.com');
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 202 and given username with user publicInfo', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@email.com',
            password: 'password1',
            username: 'my name'
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.username).to.equal('my name');
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
              email: 'valid@email.com'
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
            email: 'valid@email.com',
            password: 'password1'
          }, {
            headers: { token: normalUser1.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.username).to.equal('valid@email.com');
            expect(res.data.activated).to.be.false;
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 202 and given username with user publicInfo', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@email.com',
            password: 'password1',
            username: 'my name'
          }, {
            headers: { token: normalUser1.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.username).to.equal('my name');
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
              email: 'valid@email.com'
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
            email: 'valid@email.com',
            password: 'password1',
            activated: true
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(201);
            expect(res.data.email).to.equal('valid@email.com');
            expect(res.data.username).to.equal('valid@email.com');
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
            email: 'valid@email.com',
            password: 'password1'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.email).to.equal('valid@email.com');
            expect(res.data.username).to.equal('valid@email.com');
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
            email: 'valid@email.com',
            password: 'password1',
            username: 'my name'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.email).to.equal('valid@email.com');
            expect(res.data.username).to.equal('my name');
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
            email: 'valid@email.com',
            password: 'password1',
            username: 'my name',
            type: userType.EDITOR
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(202);
            expect(res.data.email).to.equal('valid@email.com');
            expect(res.data.username).to.equal('my name');
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
            email: 'valid@email.com',
            password: 'password1',
            username: 'my name'
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
              email: 'valid@email.com'
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
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is not present in req.body', done => {
        axios.post(`${USER_API}/getToken`, {
          password: 'normal1password'
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.post(`${USER_API}/getToken`, {
          email: 'invalidemail',
          password: 'normal1password'
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is not present in req.body', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser1.email
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is invalid', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser1.email,
          password: 'pass'
        })
        .catch(err => {
          expect(err.status).to.equal(422);
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
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email and password do not match', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser1.email,
          password: 'notnormal1password'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email account is not activated', done => {
        axios.post(`${USER_API}/getToken`, {
          email: inactiveUser.email,
          password: 'notactivatepassword1'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with user selfie and token', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normalUser1.email,
          password: 'normal1password'
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(normalUser1.email);
          expect(res.data.username).to.equal(normalUser1.username);
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
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/activateAccount`)
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is not present in req.body', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          uniqueId: normalUser2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: 'invalidemail',
          uniqueId: normalUser2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is not present in req.body', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normalUser2.email
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is invalid', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normalUser2.email,
          uniqueId: 'not uuid format'
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when email and uniqueId do not match', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normalUser2.email,
          uniqueId: normalUser1.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email is not registered', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: 'notregistered@mail.com',
          uniqueId: normalUser2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 409 when email account was already activated', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normalUser1.email,
          uniqueId: normalUser1.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('when user was valid', () => {
        it('returns 200 with user selfie', done => {
          axios.patch(`${USER_API}/activateAccount`, {
            email: normalUser2.email,
            uniqueId: normalUser2.uniqueId
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser2.email);
            expect(res.data.username).to.equal(normalUser2.username);
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
          normalUser3.destroy()
          .then(() => {
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user selfie and sets user valid', done => {
          axios.patch(`${USER_API}/activateAccount`, {
            email: normalUser3.email,
            uniqueId: normalUser3.uniqueId
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser3.email);
            expect(res.data.username).to.equal(normalUser3.username);
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
  });

  describe('PATCH /resetPassword', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/resetPassword`)
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is not present in req.body', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          password: 'newpassword2016',
          uniqueId: normalUser2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: 'invalidemail',
          password: 'newpassword2016',
          uniqueId: normalUser2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is not present in req.body', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser2.email,
          password: 'newpassword2016'
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is invalid', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser2.email,
          password: 'newpassword2016',
          uniqueId: 'not uuid format'
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is not present in req.body', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser2.email,
          uniqueId: normalUser2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is invalid', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser2.email,
          uniqueId: normalUser2.uniqueId,
          password: 'pass'
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when email and uniqueId do not match', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser2.email,
          uniqueId: normalUser1.uniqueId,
          password: 'newpassword2016'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email is not registered', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: 'notregistered@mail.com',
          uniqueId: normalUser2.uniqueId,
          password: 'newpassword2016'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 204 with no data', done => {
        axios.patch(`${USER_API}/resetPassword`, {
          email: normalUser2.email,
          uniqueId: normalUser2.uniqueId,
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
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`)
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when body contains unknown fields', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          unknown: 'fieldvalue'
        }, {
          headers: { token: normalUser2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email in req.body is invalid', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          email: 'invalidemail'
        }, {
          headers: { token: normalUser2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password in req.body is invalid', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          password: 'pass'
        }, {
          headers: { token: normalUser2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when username in req.body is invalid', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          username: 'na'
        }, {
          headers: { token: normalUser2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          email: 'newemail@testmail.com'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but not valid', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          email: 'newemail@testmail.com'
        }, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
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
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w. normal token user', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          email: 'newemail@testmail.com',
          type: userType.EDITOR
        }, {
          headers: { token: normalUser2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });

      it('returns 409 when trying to change email to an existing email', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          email: normalUser1.email
        }, {
          headers: { token: normalUser2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when trying to change username to an existing username', done => {
        axios.patch(`${USER_API}/${normalUser2.id}`, {
          username: normalUser1.email
        }, {
          headers: { token: normalUser2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('when token user is normal', () => {
        it('returns 200 with user selfie and update correct fields', done => {
          axios.patch(`${USER_API}/${normalUser2.id}`, {
            username: 'NormalUser2'
          }, {
            headers: { token: normalUser2.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NormalUser2');
            expect(res.data.email).to.equal(normalUser2.email);
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
          axios.patch(`${USER_API}/${normalUser2.id}`, {
            username: 'NormalUser2Name'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NormalUser2Name');
            expect(res.data.email).to.equal(normalUser2.email);
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
          axios.patch(`${USER_API}/${normalUser2.id}`, {
            email: 'normal2newemail@testmail.com',
            type: userType.EDITOR,
            activated: false
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NormalUser2Name');
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

      after('reset normalUser2', done => {
        User.update({
          username: normalUser2.username,
          type: normalUser2.type,
          activated: normalUser2.activated,
          email: normalUser2.email
        }, { where: { id: normalUser2.id } })
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
  });

  describe('PATCH /:username', () => {
    let newUser;
    before('create a new user', done => {
      User.create({
        username: 'newuser',
        email: 'newuser@testmail.com',
        password: 'password1',
        activated: true
      })
      .then(user => {
        newUser = user;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/${newUser.username}`)
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when body contains unknown fields', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          unknown: 'fieldvalue'
        }, {
          headers: { token: newUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email in req.body is invalid', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          email: 'invalidemail'
        }, {
          headers: { token: newUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password in req.body is invalid', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          password: 'pass'
        }, {
          headers: { token: newUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when username in req.body is invalid', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          username: 'na'
        }, {
          headers: { token: newUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          email: 'newemai2@testmail.com'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but not valid', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          email: 'newemail2@testmail.com'
        }, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
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
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w. normal token user', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          email: 'newemail2@testmail.com',
          type: userType.EDITOR
        }, {
          headers: { token: newUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });

      it('returns 409 when trying to change email to an existing email', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          email: normalUser1.email
        }, {
          headers: { token: newUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when trying to change username to an existing username', done => {
        axios.patch(`${USER_API}/${newUser.username}`, {
          username: normalUser1.email
        }, {
          headers: { token: newUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      describe('when token user is normal', () => {
        it('returns 200 with user selfie and update correct fields', done => {
          axios.patch(`${USER_API}/${newUser.username}`, {
            username: 'NewUserNameNewUser'
          }, {
            headers: { token: newUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NewUserNameNewUser');
            expect(res.data.email).to.equal(newUser.email);
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
          User.update({ username: newUser.username }, { where: { id: newUser.id } })
          .then(() => {
            done();
          })
          .catch(err => {
            done(err);
          });
        });

        it('returns 200 with user selfie and update correct fields', done => {
          axios.patch(`${USER_API}/${newUser.username}`, {
            username: 'NewUserNameUser'
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NewUserNameUser');
            expect(res.data.email).to.equal(newUser.email);
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
          axios.patch(`${USER_API}/${normalUser2.username}`, {
            username: 'NewUserNameNewUser',
            email: 'newuserhere@testmail.com',
            type: userType.EDITOR,
            activated: false
          }, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NewUserNameNewUser');
            expect(res.data.email).to.equal('newuserhere@testmail.com');
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
  });

  describe('GET /checkEmail', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.query is not present', done => {
        axios.get(`${USER_API}/checkEmail`)
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email in req.query is invalid', done => {
        axios.get(`${USER_API}/checkEmail?email=invalidemail`)
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('return 200 with isRegistered true when email is registered', done => {
        axios.get(`${USER_API}/checkEmail?email=${normalUser1.email}`)
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
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is invalid', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('return 200 with user selfie and token', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: normalUser1.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(normalUser1.email);
          expect(res.data.username).to.equal(normalUser1.username);
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
        axios.get(`${USER_API}/${normalUser1.id}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/${normalUser1.id}`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested user does not exist', done => {
        axios.get(`${USER_API}/99999999`, {
          headers: { token: normalUser1.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(412);
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
          axios.get(`${USER_API}/${normalUser1.id}`, {
            headers: { token: normalUser1.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser1.email);
            expect(res.data.username).to.equal(normalUser1.username);
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
            headers: { token: normalUser1.getToken() }
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
          axios.get(`${USER_API}/${normalUser1.id}`, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser1.email);
            expect(res.data.username).to.equal(normalUser1.username);
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
        axios.get(`${USER_API}/${normalUser1.username}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/${normalUser1.username}`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested user does not exist', done => {
        axios.get(`${USER_API}/99999999`, {
          headers: { token: normalUser1.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(412);
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
          axios.get(`${USER_API}/${normalUser1.username}`, {
            headers: { token: normalUser1.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser1.email);
            expect(res.data.username).to.equal(normalUser1.username);
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
            headers: { token: normalUser1.getToken() }
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
          axios.get(`${USER_API}/${normalUser1.username}`, {
            headers: { token: adminUser.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normalUser1.email);
            expect(res.data.username).to.equal(normalUser1.username);
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
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
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
          headers: { token: normalUser1.getToken() }
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
        axios.delete(`${USER_API}/${normalUser1.id}`, {
          headers: { }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is not valid', done => {
        axios.delete(`${USER_API}/${normalUser1.id}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.delete(`${USER_API}/${inactiveUser.id}`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when token user is not requested user', done => {
        axios.delete(`${USER_API}/${normalUser2.id}`, {
          headers: { token: normalUser1.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 204 when token user is normal', done => {
        axios.delete(`${USER_API}/${normalUser1.id}`, {
          headers: { token: normalUser1.getToken() }
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
        axios.get(`${USER_API}/checkEmail?email=${normalUser1.email}`)
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
          email: normalUser1.email,
          password: 'normal1password'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('disables the refreshToken for deleted user', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: normalUser1.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });
    });

    after('restore users', done => {
      User.restore({
        where: { id: normalUser1.id }
      })
      .then(() => {
        return User.restore({
          where: { id: inactiveUser.id }
        });
      })
      .then(() => {
        return User.update({ activated: true }, { where: { id: normalUser1.id } });
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
        axios.delete(`${USER_API}/${normalUser1.username}`, {
          headers: { }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is not valid', done => {
        axios.delete(`${USER_API}/${normalUser1.username}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.delete(`${USER_API}/${inactiveUser.username}`, {
          headers: { token: inactiveUser.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when token user is not requested user', done => {
        axios.delete(`${USER_API}/${inactiveUser.username}`, {
          headers: { token: normalUser1.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 204 when token user is normal', done => {
        axios.delete(`${USER_API}/${normalUser1.username}`, {
          headers: { token: normalUser1.getToken() }
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
        axios.get(`${USER_API}/checkEmail?email=${normalUser1.email}`)
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
          email: normalUser1.email,
          password: 'normal1password'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('disables the refreshToken for deleted user', done => {
        axios.get(`${USER_API}/refreshToken`, {
          headers: { token: normalUser1.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
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
