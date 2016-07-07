/* global describe, it, context, before, after */
/* eslint-disable prefer-arrow-callback, func-names,
  space-before-function-paren, no-unused-expressions */
import { expect } from 'chai';
import axios from 'axios';
import { SERVER_URL } from '../config/app-config';
import bcrypt from 'bcrypt-nodejs';
import { User } from '../models';

describe('/signUp', function () {
  const correctEmail = 'test@mail.com';

  context('with mal-formed request data', function() {
    it('return 422 when email is in wrong format', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {
        email: 'wrongformated.emailaddress',
        password: 'password'
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when email is an empty string', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {
        email: '',
        password: 'password'
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when password is an empty string', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {
        email: correctEmail,
        password: ''
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when request body is empty', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {})
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });
  });

  context('with correct request data', function() {
    let response;
    const correctPassword = 'password';

    before(function(done) {
      axios.post(`${SERVER_URL}/signUp`, {
        email: correctEmail,
        password: correctPassword
      })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('create a new entry in the database', function(done) {
      User.findByEmail(correctEmail).then(user => {
        expect(user).to.exist;
        expect(user.email).to.equal(correctEmail);
        expect(user.shortname).to.equal(correctEmail);
        expect(user.UUID).to.exist;
        expect(user.activated).to.be.false;
        bcrypt.compare(correctPassword, user.password, (err, isMatch) => {
          if (err) {
            return done(err);
          }
          expect(isMatch).to.be.true;
          done();
        });
      });
    });

    it('return 202 with user email', function() {
      expect(response.status).to.equal(202);
      expect(response.data.email).to.deep.equal(correctEmail);
    });
  });

  context('with semantically incorrect data', function() {
    it('return 409 when email was registered', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {
        email: correctEmail,
        password: 'password'
      })
      .catch(err => {
        expect(err.status).to.equal(409);
        done();
      });
    });
  });

  after(function(done) {
    User.findByEmail(correctEmail).then(user => {
      user.destroy();
      done();
    });
  });
});

describe('/activateAccount', function() {
  const correctEmail = 'test@mail.com';
  let correctHash;

  before(function(done) {
    axios.post(`${SERVER_URL}/signUp`, {
      email: correctEmail,
      password: 'password'
    })
    .then(() => {
      return User.findByEmail(correctEmail);
    })
    .then(user => {
      correctHash = user.UUID;
      done();
    })
    .catch(err => {
      done(err);
    });
  });

  context('with mal-formed request data', function() {
    it('return 422 when email is in wrong format', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: 'wrongformated.emailaddress',
        hash: correctHash
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when email is an empty string', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: '',
        hash: correctHash
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when hash is an empty string', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: correctEmail,
        hash: ''
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when request body is empty', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {})
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });
  });

  context('with semantically incorrect data', function() {
    it('return 401 when email is not registered', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: 'nonregistered@mail.com',
        hash: correctHash
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 401 when hash is not matched', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: correctEmail,
        hash: 'somewronghash'
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });
  });

  context('with correct request data', function() {
    let response;
    let activatedUser;
    before(function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: correctEmail,
        hash: correctHash
      })
      .then(res => {
        response = res;
        return User.findByEmail(correctEmail);
      })
      .then(user => {
        activatedUser = user;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('activate the user in database', function() {
      expect(activatedUser.activated).to.be.true;
    });

    it('return 200 with user token and user selfie', function() {
      expect(response.status).to.equal(200);
      expect(response.data.token).to.exist;
      const userData = activatedUser.selfie();
      for (const key of Object.keys(userData)) {
        expect(response.data[key]).to.equal(userData[key]);
      }
    });
  });

  context('with semantically incorrect data', function() {
    it('return 409 error when account was activated', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: correctEmail,
        hash: correctHash
      })
      .catch(err => {
        expect(err.status).to.equal(409);
        done();
      });
    });
  });

  after(function(done) {
    User.findByEmail(correctEmail).then(user => {
      user.destroy();
      done();
    });
  });
});

describe('/signIn', function() {
  const correctEmail = 'test@mail.com';
  const correctPassword = 'password';
  let correctHash;

  before(function(done) {
    axios.post(`${SERVER_URL}/signUp`, {
      email: correctEmail,
      password: correctPassword
    })
    .then(() => {
      return User.findByEmail(correctEmail);
    })
    .then(user => {
      correctHash = user.UUID;
      done();
    })
    .catch(err => {
      done(err);
    });
  });

  context('with mal-formed request data', function() {
    it('return 422 when email is in wrong format', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: 'wrongformated.emailaddress',
        password: correctPassword
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when email is an empty string', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: '',
        password: correctPassword
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when password is an empty string', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: correctEmail,
        password: ''
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when request body is empty', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {})
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });
  });

  context('with semantically incorrect data', function() {
    it('return 401 when user is not activated', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: correctEmail,
        password: correctPassword
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    after(function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: correctEmail,
        hash: correctHash
      }).then(() => {
        done();
      });
    });
  });

  context('with correct request data', function() {
    let response;
    let signedInUser;

    before(function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: correctEmail,
        password: correctPassword
      })
      .then(res => {
        response = res;
        return User.findByEmail(correctEmail);
      })
      .then(user => {
        signedInUser = user;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('return 200 with user token and selfie', function() {
      expect(response.status).to.equal(200);
      expect(response.data.token).to.exist;
      const userData = signedInUser.selfie();
      for (const key of Object.keys(userData)) {
        expect(response.data[key]).to.equal(userData[key]);
      }
    });
  });

  context('with semantically incorrect data', function() {
    it('return 401 when password is not matched', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: correctEmail,
        password: 'other password'
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 401 when email is not registered', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: 'nonregistered@mail.com',
        password: correctPassword
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });
  });

  after(function(done) {
    User.findByEmail(correctEmail).then(user => {
      user.destroy();
      done();
    });
  });
});

describe('/checkEmail', function() {
  const correctEmail = 'test@mail.com';

  before(function(done) {
    axios.post(`${SERVER_URL}/signUp`, {
      email: correctEmail,
      password: 'password'
    })
    .then(() => {
      done();
    })
    .catch(err => {
      done(err);
    });
  });

  context('with mal-formed request data', function() {
    it('return 422 when email is an empty string', function(done) {
      axios.get(`${SERVER_URL}/checkEmail`, {
        params: {
          email: ''
        }
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when email is in wrong format', function(done) {
      axios.get(`${SERVER_URL}/checkEmail`, {
        params: {
          email: 'wrongformated.emailaddress'
        }
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when query is empty', function(done) {
      axios.get(`${SERVER_URL}/checkEmail`, {
        params: {}
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });
  });

  context('with correct request data', function() {
    it('return 200 with isRegistered true when email is registered', function(done) {
      axios.get(`${SERVER_URL}/checkEmail`, {
        params: {
          email: correctEmail
        }
      })
      .then(res => {
        expect(res.status).to.equal(200);
        expect(res.data.isRegistered).to.be.true;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('return 200 with isRegistered false when email is not registered', function(done) {
      axios.get(`${SERVER_URL}/checkEmail`, {
        params: {
          email: 'nonregistered@mail.com'
        }
      })
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

  after(function(done) {
    User.findByEmail(correctEmail).then(user => {
      user.destroy();
      done();
    });
  });
});

describe('/refreshToken', function() {
  // TODO
});
