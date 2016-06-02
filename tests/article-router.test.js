const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const { User, Article } = require('../models');
const { SERVER_URL } = require('../config/app-config');
const ARTICLE_API = `${SERVER_URL}/api/article`;

context('/api/article', function() {

// userResults[4] is admin
// userResults[5] is not activated
// userResults[0-4] has two articles with one being public one private
let userResults, articleResults;
const title = 'an article title';
const content = 'the content of an article';

before('populate fake data', function(done) {
  User.createTestUsers()
  .then(result => {
    userResults = result;
    return Article.createTestArticles(userResults[0].id);
  })
  .then(result => {
    articleResults = result;
    done();
  })
  .catch(error => {
    done(error);
  });
});

describe('POST /', function() {

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

    it('return 403 when token user dose not have right to create article', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title, content },
        { headers: { token: userResults[5].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });

  });

  context('with mal-formed request data', function() {

    it('return 422 when title is not present', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { content },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when title is an empty string', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title: '', content },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when content is not present', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when content is an empty string', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title, content: '' },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

  });

  context('with correct request data', function() {

    let response, user, newArticle;
    before(function(done) {
      user = userResults[0];
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
        done(error);
      });
    });

    it('create a new entry in database', function(done) {
      Article.findById(response.data.id).then(article => {
        newArticle = article;
        expect(article.title).to.equal(title);
        expect(article.content).to.equal(content);
        expect(article.idWithAuthor).to.equal(`U${user.id}A${title}`);
        expect(article.userId).to.equal(user.id);
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('return 201 with article selfie and user selfie', function() {
      expect(response.status).to.equal(201);
      const userData = user.selfie();
      for(let key in userData) {
        expect(response.data.author[key]).to.deep.equal(userData[key]);
      }
      const ariticleData = newArticle.selfie();
      for(let key in ariticleData) {
        expect(response.data[key]).to.deep.equal(ariticleData[key]);
      }
    });

  });

  context('with semantically incorrect data', function() {
    it('return 409 when token user had the same titled article already', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title, content },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(409);
        done();
      });
    });
  });

});

describe('PATCH /:id', function() {

  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid', function(done) {
      axios.patch(`${ARTICLE_API}/${ articleResults[0].id}`,
        { content: 'new content' },
        { headers: { token: 'someinvalidtoken' } }
      )
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 401 when token is not present', function(done) {
      axios.patch(`${ARTICLE_API}/${ articleResults[0].id}`, { content: 'new content' })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 403 when token user is not the author', function(done) {
      axios.patch(`${ARTICLE_API}/${ articleResults[0].id}`,
        { content: 'new content' },
        { headers: { token: userResults[1].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });

    it('return 412 when article id does not exist', function(done) {
      axios.patch(`${ARTICLE_API}/999999`,
        { content: 'new content' },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(412);
        done();
      });
    });

    it('return 403 when trying to modify userId', function(done) {
      axios.patch(`${ARTICLE_API}/${ articleResults[0].id}`,
        { content: 'new content', userId: '112' },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });

    it('return 409 when token user had the same titled article already', function(done) {
      axios.patch(`${ARTICLE_API}/${ articleResults[0].id}`,
        { content: 'new content', title: articleResults[1].title },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(409);
        done();
      });
    });
  });

  context('with mal-formed request data', function() {
    it('return 422 when data values contain empty string', function(done) {
      axios.patch(`${ARTICLE_API}/${ articleResults[0].id}`,
        { content: '' },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when data is not present', function(done) {
      axios.patch(`${ARTICLE_API}/${ articleResults[0].id}`,
        { },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });
  });

  context('with correct request data', function() {

    let article, user, response, updatedArticle;
    const articleUpdates = {
      content: "new article data",
      title: "new article title",
      tags: ['yeelo'],
      isPublic: true
    };
    before(function(done) {
      article = articleResults[0];
      user = userResults[0];
      axios.patch(`${ARTICLE_API}/${ article.id}`,
        articleUpdates,
        { headers: { token: user.getToken() } }
      )
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('update the database with request data', function(done) {
      Article.findById(article.id)
      .then(arti => {
        updatedArticle = arti;
        for (const key in articleUpdates) {
          expect(updatedArticle[key]).to.deep.equal(articleUpdates[key]);
        }
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('return 200 with article selfie and author selfie', function() {
      expect(response.status).to.equal(200);
      const userData = user.selfie();
      for(let key in userData) {
        expect(response.data.author[key]).to.deep.equal(userData[key]);
      }
      const ariticleData = updatedArticle.selfie();
      for(let key in ariticleData) {
        expect(response.data[key]).to.deep.equal(ariticleData[key]);
      }
    });
  });
});

describe('DELETE /:id', function() {
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid');
    it('return 401 when token is not present');
    it('return 403 when token user is not the author');
    it('return 412 when article id does not exist');
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
    it('return 200 with article data and author intro');
  });
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid and article is private');
    it('return 401 when token is not present and article is private');
    it('return 403 when token user is not the author and article is private');
  });
});

after(function(done) {
  User.removeTestUsers().then(res => {
    done();
  }).catch(err => {
    done(err);
  })
});

})
