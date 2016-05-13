const supertest = require('supertest');
const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');

const { User } = require('../models');

const api = supertest('http://localhost:3000');

describe('Authentication', function() {
  const password = 'password';
  const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);

  describe('Successful Sign Up', function() {
    let newUser;
    let beforeCount;
    let userRes;
    const email = 'test@mail.com';

    before(function(done) {
      User.count().then(count => { // get the initial count of users
        beforeCount = count;
        api.post('/signup') // send the request to sign up a new user
        .send({
          email,
          password
        })
        .end((err, res) => {
          userRes = res; // store the response send back by server
          User.find({ where: { email }}).then(user => { // find the user in database
            newUser = user;
            done();
          });
        });
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

  describe('Successful Sign Up', function() {
    let newUser;
    let beforeCount;
    let userRes;
    const email = "@mail.com";
    before(function(done) {
      User.count().then(count => { // get the initial count of users
        beforeCount = count;
        api.post('/signup') // send the request to sign up a new user
        .send({
          email,
          password
        })
        .end((err, res) => {
          userRes = res; // store the response send back by server
          User.find({ where: { email }}).then(user => { // find the user in database
            newUser = user;
            done();
          });
        });
      });
    });

    it('should NOT create a new entry in the database', function(done) {
      User.count().then(count => {
        expect(count).to.equal(beforeCount);
        done();
      });
    });

    it('should NOT return any user information', function() {

      expect(newUser).to.be.null;
    });

    it('should return response code 400', function() {
      expect(userRes.status).to.equal(400);
    });

  });
});
