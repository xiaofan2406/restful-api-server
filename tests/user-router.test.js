/* global describe, it, context, before, after, afterEach */
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
        it('returns 200 and update correct fields');
      });

      describe('when token user is admin', () => {
        it('returns 200 and update correct fields');
        it('returns 200 and update admin fields');
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
