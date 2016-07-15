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
  let admin;
  let normal1;
  let normal2;
  let notActivated;
  before('create sample users', done => {
    User.bulkCreate(sampleUsersData, { returning: true, individualHooks: true })
    .then(users => {
      normal1 = users[0];
      normal2 = users[1];
      notActivated = users[2];
      admin = users[3];
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
          headers: { token: notActivated.getToken() }
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
          headers: { token: normal1.getToken() }
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
          email: normal1.email,
          password: 'password1'
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      // TODO how do i test registration email are sent
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

      describe('when token user is normal', () => {
        it('returns 202 and default username with user publicInfo', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@email.com',
            password: 'password1'
          }, {
            headers: { token: normal1.getToken() }
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
            headers: { token: normal1.getToken() }
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

      describe('when token user is admin', () => {
        it('returns 201 with user selfie when activated is set to true', done => {
          axios.post(`${USER_API}/`, {
            email: 'valid@email.com',
            password: 'password1',
            activated: true
          }, {
            headers: { token: admin.getToken() }
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
            headers: { token: admin.getToken() }
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
            headers: { token: admin.getToken() }
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
            headers: { token: admin.getToken() }
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
            headers: { token: admin.getToken() }
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
          email: normal1.email
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password is invalid', done => {
        axios.post(`${USER_API}/getToken`, {
          email: normal1.email,
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
          email: normal1.email,
          password: 'notnormal1password'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email account is not activated', done => {
        axios.post(`${USER_API}/getToken`, {
          email: notActivated.email,
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
          email: normal1.email,
          password: 'normal1password'
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(normal1.email);
          expect(res.data.username).to.equal(normal1.username);
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
          uniqueId: normal2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email is invalid', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: 'invalidemail',
          uniqueId: normal2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is not present in req.body', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normal2.email
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when uniqueId is invalid', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normal2.email,
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
          email: normal2.email,
          uniqueId: normal1.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when email is not registered', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: 'notregistered@mail.com',
          uniqueId: normal2.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 409 when email account was already activated', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normal1.email,
          uniqueId: normal1.uniqueId
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });
    });

    context('with valid request data', () => {
      it('returns 200 with user selfie', done => {
        axios.patch(`${USER_API}/activateAccount`, {
          email: normal2.email,
          uniqueId: normal2.uniqueId
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(normal2.email);
          expect(res.data.username).to.equal(normal2.username);
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

  describe('PATCH /:id', () => {
    context('with mal-formed request data', () => {
      it('returns 422 when req.body is not present', done => {
        axios.patch(`${USER_API}/${normal2.id}`)
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when body contains unknown fields', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
          unknown: 'fieldvalue'
        }, {
          headers: { token: normal2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when email in req.body is invalid', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
          email: 'invalidemail'
        }, {
          headers: { token: normal2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when password in req.body is invalid', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
          password: 'pass'
        }, {
          headers: { token: normal2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });

      it('returns 422 when username in req.body is invalid', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
          username: 'na'
        }, {
          headers: { token: normal2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(422);
          done();
        });
      });
    });

    context('with semantically incorrect request data', () => {
      it('returns 401 when token is not present', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
          email: 'newemail@testmail.com'
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token is in header but not valid', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
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
        axios.patch(`${USER_API}/${notActivated.id}`, {
          email: 'newemail@testmail.com'
        }, {
          headers: { token: notActivated.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 403 when unaccessible fields are present w. normal token user', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
          email: 'newemail@testmail.com',
          type: userType.EDITOR
        }, {
          headers: { token: normal2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(403);
          done();
        });
      });

      it('returns 409 when trying to change email to an existing email', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
          email: normal1.email
        }, {
          headers: { token: normal2.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(409);
          done();
        });
      });

      it('returns 409 when trying to change username to an existing username', done => {
        axios.patch(`${USER_API}/${normal2.id}`, {
          username: normal1.email
        }, {
          headers: { token: normal2.getToken() }
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
          axios.patch(`${USER_API}/${normal2.id}`, {
            username: 'NormalUser2'
          }, {
            headers: { token: normal2.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NormalUser2');
            expect(res.data.email).to.equal(normal2.email);
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

      describe('when token user is admin', () => {
        it('returns 200 with user selfie and update correct fields', done => {
          axios.patch(`${USER_API}/${normal2.id}`, {
            username: 'NormalUser2Name'
          }, {
            headers: { token: admin.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.username).to.equal('NormalUser2Name');
            expect(res.data.email).to.equal(normal2.email);
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

        it('returns 200 with user selfie and update admin fields', done => {
          axios.patch(`${USER_API}/${normal2.id}`, {
            email: 'normal2newemail@testmail.com',
            type: userType.EDITOR,
            activated: false
          }, {
            headers: { token: admin.getToken() }
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

      after('reset normal2', done => {
        User.update({
          username: normal2.username,
          type: normal2.type,
          activated: normal2.activated,
          email: normal2.email
        }, { where: { id: normal2.id } })
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
        axios.patch(`${USER_API}/${notActivated.username}`, {
          email: 'newemail@testmail.com'
        }, {
          headers: { token: notActivated.getToken() }
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
          email: normal1.email
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
          username: normal1.email
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

      describe('when token user is admin', () => {
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
            headers: { token: admin.getToken() }
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

        it('returns 200 with user selfie and update admin fields', done => {
          axios.patch(`${USER_API}/${normal2.username}`, {
            username: 'NewUserNameNewUser',
            email: 'newuserhere@testmail.com',
            type: userType.EDITOR,
            activated: false
          }, {
            headers: { token: admin.getToken() }
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
        axios.get(`${USER_API}/checkEmail?email=${normal1.email}`)
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
          headers: { token: notActivated.getToken() }
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
          headers: { token: normal1.getToken() }
        })
        .then(res => {
          expect(res.status).to.equal(200);
          expect(res.data.email).to.equal(normal1.email);
          expect(res.data.username).to.equal(normal1.username);
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
        axios.get(`${USER_API}/${normal1.id}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/${normal1.id}`, {
          headers: { token: notActivated.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested user does not exist', done => {
        axios.get(`${USER_API}/99999999`, {
          headers: { token: normal1.getToken() }
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
          axios.get(`${USER_API}/${admin.id}`)
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.not.exist;
            expect(res.data.username).to.equal(admin.username);
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
          axios.get(`${USER_API}/${normal1.id}`, {
            headers: { token: normal1.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normal1.email);
            expect(res.data.username).to.equal(normal1.username);
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
          axios.get(`${USER_API}/${admin.id}`, {
            headers: { token: normal1.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.not.exist;
            expect(res.data.username).to.equal(admin.username);
            expect(res.data.type).to.not.exist;
            expect(res.data.activated).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('with admin token user', () => {
        it('returns 200 with user selfie when token user is requested user', done => {
          axios.get(`${USER_API}/${admin.id}`, {
            headers: { token: admin.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(admin.email);
            expect(res.data.username).to.equal(admin.username);
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
          axios.get(`${USER_API}/${normal1.id}`, {
            headers: { token: admin.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normal1.email);
            expect(res.data.username).to.equal(normal1.username);
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
        axios.get(`${USER_API}/${normal1.username}`, {
          headers: { token: 'invalid token' }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 401 when token user is not activated', done => {
        axios.get(`${USER_API}/${normal1.username}`, {
          headers: { token: notActivated.getToken() }
        })
        .catch(err => {
          expect(err.status).to.equal(401);
          done();
        });
      });

      it('returns 412 when requested user does not exist', done => {
        axios.get(`${USER_API}/99999999`, {
          headers: { token: normal1.getToken() }
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
          axios.get(`${USER_API}/${admin.username}`)
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.not.exist;
            expect(res.data.username).to.equal(admin.username);
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
          axios.get(`${USER_API}/${normal1.username}`, {
            headers: { token: normal1.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normal1.email);
            expect(res.data.username).to.equal(normal1.username);
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
          axios.get(`${USER_API}/${admin.username}`, {
            headers: { token: normal1.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.not.exist;
            expect(res.data.username).to.equal(admin.username);
            expect(res.data.type).to.not.exist;
            expect(res.data.activated).to.be.true;
            done();
          })
          .catch(err => {
            done(err);
          });
        });
      });

      describe('with admin token user', () => {
        it('returns 200 with user selfie when token user is requested user', done => {
          axios.get(`${USER_API}/${admin.username}`, {
            headers: { token: admin.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(admin.email);
            expect(res.data.username).to.equal(admin.username);
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
          axios.get(`${USER_API}/${normal1.username}`, {
            headers: { token: admin.getToken() }
          })
          .then(res => {
            expect(res.status).to.equal(200);
            expect(res.data.email).to.equal(normal1.email);
            expect(res.data.username).to.equal(normal1.username);
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

  after('clean up sample users', done => {
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
