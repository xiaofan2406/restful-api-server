const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const { User, Article } = require('../models');
const { SERVER_URL } = require('../config/app-config');
const ARTICLE_API = `${SERVER_URL}/api/article`;

describe('/api/article', function() {

describe('POST /', function() {
  let userResult, articleResult;
  before('populate fake data', function(done) {
    User.createTestUsers().then(result => {
      userResult = result;
      return Article.createTestArticles(userResult[0].id);
    })
    .then(result => {
      articleResult = result;
      done()
    })
    .catch(error => {
      done(error);
    })
  });

  describe('with mal-formed request data', function() {

  });

  describe('with correct request data', function() {
    const title = 'an article title';
    const content = 'the content of an ariticle';
    let response;
    before(function(done) {
      const user = userResult[0];
      axios.post(`${ARTICLE_API}/`,  {
        title,
        content,
        userId: user.id
      })
      .then(res => {
        response = res;
        done();
      })
      .catch(error => {
        done();
      })
    });

    it('create a new entry in database', function(done) {

    });

    it('return 201 with article title and user displayName', function() {
      expect(response.status).to.equal(201);
      expect(response.data.title).to.equal(title);
      expect(response.data.author).to.equal(user.displayName);
    })
  });

  describe('with semantically incorrect data', function() {

  });

  after(function(done) {
    User.removeTestUsers().then(res => {
      done();
    }).catch(err => {
      done(err);
    })
  });

});

describe('PATCH /:id', function() {

});

describe('DELETE /:id', function() {

});

describe('GET /', function() {


});

describe('GET /:id', function() {

});


})
