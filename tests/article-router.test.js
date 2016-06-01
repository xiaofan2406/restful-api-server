const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const { User, Article } = require('../models');
const { SERVER_URL } = require('../config/app-config');
const ARTICLE_API = `${SERVER_URL}/api/article`;

context('/api/article', function() {

describe('POST /', function() {
  // userResult[4] is admin
  // userResult[5] is not activated
  // userResult[0-4] has two articles with one being public one private
  let userResult, articleResult;
  const title = 'an article title';
  const content = 'the content of an ariticle';

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

  context('with semantically incorrect data', function() {

    it('return 401 when token is invalid', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title, content },
        { headers: { token: 'invalidtoken' } }
      )
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 401 when token is not present', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title, content }
      )
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 403 when token user dose not have right to create ariticle', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title, content },
        { headers: { token: userResult[5].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });

    it('return 409 when token user had the same titled ariticle already', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title, content },
        { headers: { token: userResult[0].getToken() } }
      )
      .then(res => {
        return axios.post(`${ARTICLE_API}/`,
          { title, content },
          { headers: { token: userResult[0].getToken() } }
        );
      })
      .catch(err => {
        expect(err.status).to.equal(409);
        done();
      });
    });
  });

  context('with mal-formed request data', function() {

    it('return 422 when title is not present', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { content },
        { headers: { token: userResult[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when title is an empty string', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title: '', content },
        { headers: { token: userResult[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when content is not present', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title },
        { headers: { token: userResult[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when content is an empty string', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title, content: '' },
        { headers: { token: userResult[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

  });

  context('with correct request data', function() {

    let response, user;
    before(function(done) {
      user = userResult[0];
      axios.post(`${ARTICLE_API}/`,  {
        title,
        content,
        userId: user.id
      }, {
        headers: {
          token: user.getToken()
        }
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
      Article.findById(response.id).then(ariticle => {
        expect(article.title).to.equal(title);
        expect(article.content).to.equal(content);
        expect(article.idWithAuthor).to.equal(`U${user.id}A${title}`);
        expect(article.userId).to.equal(user.id);
      })
      .catch(err => {
        console.log(err);
        done();
      })
    });

    it('return 201 with article title and user displayName', function() {
      expect(response.status).to.equal(201);
      expect(response.data.title).to.equal(title);
      expect(response.data.author).to.equal(userResult[0].displayName);
    });

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
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid');
    it('return 401 when token is not present');
    it('return 403 when token user is not the author');
    it('return 404 when article id does not exist');
    it('return 409 when token user had the same titled ariticle already');
  });
  context('with mal-formed request data', function() {
    it('return 422 when data values contain empty string');
    it('return 422 when data is not present');
  });
  context('with correct request data', function() {

  });
});

describe('DELETE /:id', function() {
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid');
    it('return 401 when token is not present');
    it('return 403 when token user is not the author');
    it('return 404 when article id does not exist');
  });
  context('with correct request data', function() {

  });
});

describe('GET /public', function() {
  context('with semantically incorrect data', function() {

  });
  context('with mal-formed request data', function() {

  });
  context('with correct request data', function() {

  });
});

describe('GET /all', function() {
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid');
    it('return 401 when token is not present');
    it('return 403 when token user is not admin');
  });
  context('with mal-formed request data', function() {

  });
  context('with correct request data', function() {

  });
});

describe('GET /:id', function() {
  context('with mal-formed request data', function() {

  });
  context('with correct request data', function() {
    it('return 200 with ariticle data and author intro');
  });
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid and article is private');
    it('return 401 when token is not present and ariticle is private');
    it('return 403 when token user is not the author and ariticle is private');
  });
});

})
