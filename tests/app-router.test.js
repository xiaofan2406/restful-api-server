const supertest = require('supertest');
const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');

const { User } =  require('../models');

const api = supertest('http://192.168.1.49:3000');

describe('Authentication', function() {

  let userRes;
  const email = 'test@mail.com';
  const password = 'password';
  const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
  let beforeCount;

  before(function(done) {
    User.count().then(count => {
      beforeCount = count;
      api.post('/signup')
      .send({
        email,
        password
      })
      .end((err, res) => {
        userRes = res;
        done();
      });
    });
  });
  describe('Sign up', function() {
    let newUser;
    before(function(done) {
      User.find({ where: { email }}).then(user => {
        newUser = user;
        done();
      });
    });

    it('should create a new entry in the database', function(done) {
      User.count().then(count => {
        expect(count).to.equal(beforeCount + 1);
        done();
      });
    });

    it('should encrypt password in the database', function(done) {
      bcrypt.compare(password, newUser.password, (err, isMatch) => {
        if (err) {
          throw err;
        }
        expect(isMatch).to.be.true;
        done();
      });
    });

    it('should return the user information', function() {
      expect(userRes.status).to.equal(201);
      expect(userRes.body.email).to.equal(email);
      expect(userRes.body).to.have.ownProperty('token');
    });

    after(function() {
      newUser.destroy();
    });
  });
});
