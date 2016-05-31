const supertest = require('supertest');
const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const { User } = require('../models');

const { SERVER_URL } = require('../config/app-config');

describe('/signUp', function() {
  const correctEmail = 'test@mail.com';

  describe('with correct request data', function() {
    let errorRes, response;
    const email = correctEmail;
    const password = 'password';
    const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);

    before(function(done) {
      axios.post(`${SERVER_URL}/signUp`, { email,  password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done(err);
      });
    });

    it('should create a new entry in the database', function(done) {
      User.findByEmail(email).then(user => {
        expect(user).to.exist;
        expect(user.email).to.equal(email);
        expect(user.displayName).to.equal(email);
        expect(user.UUID).to.exist;
        expect(user.activated).to.be.false;
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            return done(err);
          }
          expect(isMatch).to.be.true;
          done();
        });
      });
    });

    it('should return the user displayName', function() {
      expect(response.status).to.equal(202);
      expect(response.data.displayName).to.equal(email);
    });
  });

  describe('with mal-formed request data', function() {

  });

  describe('with wrong email format', function() {
    let errorRes, response;
    const email = 'email';
    const password = 'password';

    before(function(done) {
      axios.post(`${SERVER_URL}/signUp`, { email,  password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      });
    });

    it('should return an 422 error', function() {
      expect(errorRes.status).to.equal(422);
    });
  });

  describe('with empty email', function() {
    let errorRes, response;
    const email = '';
    const password = 'password';

    before(function(done) {
      axios.post(`${SERVER_URL}/signUp`, { email, password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      });
    });

    it('should return an 422 error', function() {
      expect(errorRes.status).to.equal(422);
    });
  });

  describe('with no password', function() {
    let errorRes, response;
    const email = 'email@mail.com';
    const password = '';

    before(function(done) {
      axios.post(`${SERVER_URL}/signUp`, { email, password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      });
    });

    it('should return an 422 error', function() {
      expect(errorRes.status).to.equal(422);
    });
  });

  describe('duplicate account', function() {
    let errorRes, response;
    const email = correctEmail;
    const password = 'password';

    before(function(done) {
      axios.post(`${SERVER_URL}/signUp`, { email, password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      });
    });

    it('should return an 500 error', function() {
      expect(errorRes.status).to.equal(500);
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

  describe('with non-existing email', function() {
    let errorRes, response;
    const email = 'non-existing@mail.com';

    before(function(done) {
      const hash = newUser.UUID;
      axios.patch(`${SERVER_URL}/activateAccount`, { email, hash })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      });
    });

    it('should return an 422 error', function() {
      expect(errorRes.status).to.equal(422);
    });
  });

  describe('with non-matching hash', function() {
    let errorRes, response;
    const email = correctEmail;

    before(function(done) {
      const hash = 'some non-matching hash';
      axios.patch(`${SERVER_URL}/activateAccount`, { email, hash })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      });
    });

    it('should return an 401 error', function() {
      expect(errorRes.status).to.equal(401);
    });
  });

  describe('with correct request data', function() {
    let errorRes, response;
    const email = correctEmail;

    before(function(done) {
      const hash = newUser.UUID;
      axios.patch(`${SERVER_URL}/activateAccount`, { email, hash })
      .then(res => {
        response = res;
        return User.findByEmail(email);
      })
      .then(user => {
        newUser = user;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('should activate the user in database', function() {
      expect(newUser.activated).to.be.true;
    });

    it('should return an user token and displayName', function() {
      expect(response.status).to.equal(200);
      expect(response.data.token).to.exist;
      expect(response.data.displayName).to.equal(email);
    });
  });

  describe('with mal-formed request data', function() {

  });

  describe('duplicate activation', function() {
    let errorRes, response;
    const email = correctEmail;

    before(function(done) {
      const hash = newUser.UUID;
      axios.patch(`${SERVER_URL}/activateAccount`, { email, hash })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      });
    });

    it('should return an 409 error', function() {
      expect(errorRes.status).to.equal(409);
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

  describe('with non-activated user', function() {
    let errorRes, response;
    const email = correctEmail;
    const password = 'password';

    before(function(done) {
      axios.post(`${SERVER_URL}/signIn`, { email, password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      })
    });

    it('should return an 400 error', function() {
      expect(errorRes.status).to.equal(400);
    });

    after(function(done) {
      axios.patch(`${SERVER_URL}/activateAccount`, {
        email: correctEmail,
        hash: newUser.UUID
      }).then(res => {
        done();
      });
    });
  });

  describe('with correct request data', function() {
    let errorRes, response;
    const email = correctEmail;
    const password = 'password';

    before(function(done) {
      axios.post(`${SERVER_URL}/signIn`, { email, password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      })
    });

    it('should return user token and displayName', function() {
      expect(response.status).to.equal(200);
      expect(response.data.token).to.exist;
      expect(response.data.displayName).to.equal(email);
    });
  });

  describe('with mal-formed request data', function() {

  });

  describe('with non-matching password', function() {
    let errorRes, response;
    const email = correctEmail;
    const password = 'some other password';

    before(function(done) {
      axios.post(`${SERVER_URL}/signIn`, { email, password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      })
    });

    it('should return a 401 error', function() {
      expect(errorRes.status).to.equal(401);
    });
  });

  describe('with non-existing email', function() {
    let errorRes, response;
    const email = 'non-existing@mail.com';
    const password = 'password';

    before(function(done) {
      axios.post(`${SERVER_URL}/signIn`, { email, password })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        errorRes = err;
        done();
      })
    });

    it('should return a 422 error', function() {
      expect(errorRes.status).to.equal(422);
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

  });


  after(function(done) {
    User.findByEmail(correctEmail).then(user => {
      user.destroy();
      done();
    });
  });

});
