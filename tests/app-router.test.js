const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const { User } = require('../models');
const { SERVER_URL } = require('../config/app-config');

describe('/signUp', function() {
  const correctEmail = 'test@mail.com';

  describe('with mal-formed request data', function() {

    it('return 422 error when email is in wrong format', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {
        email: 'wrongformated.emailaddress',
        password: 'password'
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when email is an empty string', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {
        email: '',
        password: 'password'
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when password is an empty string', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {
        email: correctEmail,
        password: ''
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when request body is empty', function(done) {
      axios.post(`${SERVER_URL}/signUp`, {})
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });
  });

  describe('with correct request data', function() {
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
        expect(user.displayName).to.equal(correctEmail);
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

    it('return 202 with user displayName', function() {
      expect(response.status).to.equal(202);
      expect(response.data.displayName).to.equal(correctEmail);
    });
  });

  describe('with semantically incorrect data', function() {

    it('return 409 error when email was registered', function(done) {
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
    .then(res => {
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

  describe('with mal-formed request data', function() {

    it('return 422 error when email is in wrong format', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: 'wrongformated.emailaddress',
        hash: correctHash
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when email is an empty string', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: '',
        hash: correctHash
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when hash is an empty string', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: correctEmail,
        hash: ''
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when request body is empty', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {})
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

  });

  describe('with semantically incorrect data', function() {

    it('return 401 error when email is not registered', function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: 'nonregistered@mail.com',
        hash: correctHash
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 401 error when hash is not matched', function(done) {
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

  describe('with correct request data', function() {
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

    it('return 200 with user token and displayName', function() {
      expect(response.status).to.equal(200);
      expect(response.data.token).to.exist;
      expect(response.data.displayName).to.equal(correctEmail);
    });
  });

  describe('with semantically incorrect data', function() {

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
    .then(res => {
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

  describe('with mal-formed request data', function() {

    it('return 422 error when email is in wrong format', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: 'wrongformated.emailaddress',
        password: correctPassword
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when email is an empty string', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: '',
        password: correctPassword
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when password is an empty string', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: correctEmail,
        password: ''
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 error when request body is empty', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {})
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

  });

  describe('with semantically incorrect data', function() {

    it('return 401 error when user is not activated', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: correctEmail,
        password: correctPassword
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      })
    });

    after(function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: correctEmail,
        hash: correctHash
      }).then(res => {
        done();
      });
    });

  });

  describe('with correct request data', function() {
    let response;

    before(function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: correctEmail,
        password: correctPassword
      })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        done(err);
      })
    });

    it('return 200 with user token and displayName', function() {
      expect(response.status).to.equal(200);
      expect(response.data.token).to.exist;
      expect(response.data.displayName).to.equal(correctEmail);
    });
  });

  describe('with semantically incorrect data', function() {

    it('return 401 error when password is not matched', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: correctEmail,
        password: 'other password'
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      })
    });

    it('return 401 error when email is not registered', function(done) {
      axios.post(`${SERVER_URL}/signIn`, {
        email: 'nonregistered@mail.com',
        password: correctPassword
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      })
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
  let newUser;
  const correctEmail = 'test@mail.com';

  before(function(done) {
    axios.post(`${SERVER_URL}/signUp`, {
      email: correctEmail,
      password: 'password'
    })
    .then(res => {
      return User.findByEmail(correctEmail);
    })
    .then(user => {
      newUser = user;
      done();
    })
    .catch(err => {
      done(err);
    });
  });

  describe('with mal-formed request data', function() {

    it('return 422 error when email is an empty string', function(done) {
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

    it('return 422 error when email is in wrong format', function(done) {
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

    it('return 422 error when query is empty', function(done) {
      axios.get(`${SERVER_URL}/checkEmail`, {
        params: {}
      })
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

  });

  describe('with correct request data', function() {

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
          email: "nonregistered@mail.com"
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
