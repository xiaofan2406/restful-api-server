const expect = require('chai').expect;
const bcrypt = require('bcrypt-nodejs');
const axios = require('axios');
const { User, Article } = require('../models');
const { SERVER_URL } = require('../config/app-config');
const ARTICLE_API = `${SERVER_URL}/api/article`;
const { sampleUsersData } = require('./helpers');

// TODO edge cases?

context('/api/article', function() {

let userResults, articleResults;
const title = 'an new article title';
const content = 'the new content of an article';

before('populate fake data', function(done) {
  User.bulkCreate(sampleUsersData, { returning: true })
  .then(result => {
    userResults = result;
    const sampleArticlesData = [{
      title: 'private article 1',
      content: 'content for private article 1',
      tags: ['greate'],
      categories: ['personal'],
      isPublic: false,
      authorId: userResults[0].id
    }, {
      title: 'public article 2',
      content: 'content for public article 2',
      tags: ['greate'],
      categories: ['personal'],
      isPublic: true,
      authorId: userResults[0].id
    }, {
      title: 'private article 3',
      content: 'content for private article 3',
      tags: ['greate'],
      categories: ['personal'],
      isPublic: false,
      authorId: userResults[1].id
    }, {
      title: 'public article 4',
      content: 'content for public article 4',
      tags: ['greate'],
      categories: ['personal'],
      isPublic: true,
      authorId: userResults[1].id
    }];
    return Article.bulkCreate(sampleArticlesData, {
      returning: true,
      validate: true,
      individualHooks: true
    });
  })
  .then(result => {
    articleResults = result;
    done();
  }).catch(error => {
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
        { headers: { token: userResults[2].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });

    it('return 409 when token user had the same titled article already', function(done) {
      axios.post(`${ARTICLE_API}/`,
        { title: articleResults[0].title, content },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(409);
        done();
      });
    });

    it('return 400 when unknow field is present request');
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
        isPublic: true
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
        expect(article.authorId).to.equal(user.id);
        expect(article.isPublic).to.be.true;
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('return 201 with article selfie and author publicSnapshot', function() {
      expect(response.status).to.equal(201);
      const userData = user.publicSnapshot();
      for(let key in userData) {
        expect(response.data.author[key]).to.deep.equal(userData[key]);
      }
      const articleData = newArticle.selfie();
      for(let key in articleData) {
        expect(response.data[key]).to.deep.equal(articleData[key]);
      }
    });
  });
});

describe('PATCH /:id', function() {
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid', function(done) {
      axios.patch(`${ARTICLE_API}/${articleResults[0].id}`,
        { content: 'new content' },
        { headers: { token: 'someinvalidtoken' } }
      )
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 401 when token is not present', function(done) {
      axios.patch(`${ARTICLE_API}/${articleResults[0].id}`, { content: 'new content' })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });

    it('return 403 when token user is not the author', function(done) {
      axios.patch(`${ARTICLE_API}/${articleResults[0].id}`,
        { content: 'new content' },
        { headers: { token: userResults[1].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });

    it('return 412 when article id does not exist', function(done) {
      axios.patch(`${ARTICLE_API}/99999999`,
        { content: 'new content' },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(412);
        done();
      });
    });

    it('return 403 when trying to modify authorId', function(done) {
      axios.patch(`${ARTICLE_API}/${articleResults[0].id}`,
        { content: 'new content', authorId: userResults[1].id },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });

    it('return 409 when token user had the same titled article already', function(done) {
      axios.patch(`${ARTICLE_API}/${articleResults[0].id}`,
        { content: 'new content', title: articleResults[1].title },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(409);
        done();
      });
    });

    it('return 400 when unknow field is present request');
  });

  context('with mal-formed request data', function() {
    it('return 422 when data values contain empty string', function(done) {
      axios.patch(`${ARTICLE_API}/${articleResults[0].id}`,
        { content: '' },
        { headers: { token: userResults[0].getToken() } }
      )
      .catch(err => {
        expect(err.status).to.equal(422);
        done();
      });
    });

    it('return 422 when data is not present', function(done) {
      axios.patch(`${ARTICLE_API}/${articleResults[0].id}`,
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
      isPublic: false
    };
    before(function(done) {
      article = articleResults[1];
      user = userResults[0];
      axios.patch(`${ARTICLE_API}/${article.id}`,
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
        console.log(updatedArticle);
        for (const key in articleUpdates) {
          expect(articleUpdates[key]).to.deep.equal(updatedArticle[key]);
        }
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('update column idWithAuthor in database when title is updated', function() {
      if (articleUpdates.title) {
        expect(updatedArticle.idWithAuthor).to.equal(`U${user.id}A${articleUpdates.title}`);
      } else {
        expect(updatedArticle.idWithAuthor).to.equal(article.idWithAuthor);
      }
    });

    it('return 200 with article selfie and author publicSnapshot', function() {
      expect(response.status).to.equal(200);
      const userData = user.publicSnapshot();
      for(let key in userData) {
        expect(response.data.author[key]).to.deep.equal(userData[key]);
      }
      const articleData = updatedArticle.selfie();
      for(let key in articleData) {
        expect(response.data[key]).to.deep.equal(articleData[key]);
      }
    });
  });
});

describe('DELETE /:id', function() {
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid', function(done) {
      axios.delete(`${ARTICLE_API}/${articleResults[0].id}`, {
        headers: { token: 'someinvalidtoken' }
      })
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });
    it('return 401 when token is not present', function(done) {
      axios.delete(`${ARTICLE_API}/${articleResults[0].id}`)
      .catch(err => {
        expect(err.status).to.equal(401);
        done();
      });
    });
    it('return 403 when token user is not the author', function(done) {
      axios.delete(`${ARTICLE_API}/${articleResults[0].id}`, {
        headers: { token: userResults[2].getToken() }
      })
      .catch(err => {
        expect(err.status).to.equal(403);
        done();
      });
    });
    it('return 412 when article id does not exist', function(done) {
      axios.delete(`${ARTICLE_API}/99999999`, {
        headers: { token: userResults[0].getToken() }
      })
      .catch(err => {
        expect(err.status).to.equal(412);
        done();
      });
    });
  });

  context('with correct request data', function() {
    let response, article, user;
    before(function(done) {
      article = articleResults[0];
      user = userResults[0];
      axios.delete(`${ARTICLE_API}/${article.id}`, {
        headers: { token: user.getToken() }
      })
      .then(res => {
        response = res;
        done();
      })
      .catch(err => {
        expect(err.status).to.equal(412);
        done();
      });
    });
    it('paranoid "delete" article in the database', function(done) {
      Article.findAll({ where: { id: article.id }, paranoid: true })
      .then(article => {
        expect(article.deleteAt).to.not.be.null;
        done();
      })
      .catch(error => {
        done(error);
      });
    });

    it('return 204', function() {
      expect(response.status).to.equal(204);
    });
  });
});

describe('GET /:id', function() {
  context('with correct request data', function() {
    it('return 200 with article selfie and author publicSnapshot for public when token user is author', function(done) {
      const author = userResults[1];
      const article = articleResults[3];
      axios.get(`${ARTICLE_API}/${article.id}`, {
        headers: { token: author.getToken() }
      })
      .then(res => {
        expect(res.status).to.equal(200);
        const authorData = author.publicSnapshot();
        for(let key in authorData) {
          expect(res.data.author[key]).to.deep.equal(authorData[key]);
        }
        const articleData = article.selfie();
        for(let key in articleData) {
          expect(res.data[key]).to.deep.equal(articleData[key]);
        }
        done();
      })
      .catch(error => {
        done(error);
      });
    });

    it('return 200 with article selfie and author publicSnapshot for public when token user is not author', function(done) {
      const author = userResults[1];
      const article = articleResults[3];
      axios.get(`${ARTICLE_API}/${article.id}`, {
        headers: { token: userResults[3].getToken() }
      })
      .then(res => {
        expect(res.status).to.equal(200);
        const authorData = author.publicSnapshot();
        for(let key in authorData) {
          expect(res.data.author[key]).to.deep.equal(authorData[key]);
        }
        const articleData = article.selfie();
        for(let key in articleData) {
          expect(res.data[key]).to.deep.equal(articleData[key]);
        }
        done();
      })
      .catch(error => {
        done(error);
      });
    });

    it('return 200 with article selfie and author publicSnapshot for private when token user is author', function(done) {
      const author = userResults[1];
      const article = articleResults[2];
      axios.get(`${ARTICLE_API}/${article.id}`, {
        headers: { token: author.getToken() }
      })
      .then(res => {
        expect(res.status).to.equal(200);
        const authorData = author.publicSnapshot();
        for(let key in authorData) {
          expect(res.data.author[key]).to.deep.equal(authorData[key]);
        }
        const articleData = article.selfie();
        for(let key in articleData) {
          expect(res.data[key]).to.deep.equal(articleData[key]);
        }
        done();
      })
      .catch(error => {
        done(error);
      });
    });
  });

  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid and article is private', function(done) {
      axios.get(`${ARTICLE_API}/${articleResults[2].id}`, {
        headers: { token: 'invalid token' }
      })
      .catch(error => {
        expect(error.status).to.equal(401);
        done();
      });
    });

    it('return 401 when token is not valid and article is public', function(done) {
      axios.get(`${ARTICLE_API}/${articleResults[1].id}`, {
        headers: { token: 'invalid token' }
      })
      .catch(error => {
        expect(error.status).to.equal(401);
        done();
      });
    });

    it('return 403 when token is not present and article is private', function(done) {
      axios.get(`${ARTICLE_API}/${articleResults[2].id}`)
      .catch(error => {
        expect(error.status).to.equal(403);
        done();
      });
    });

    it('return 403 when token user is not the author and article is private', function(done) {
      axios.get(`${ARTICLE_API}/${articleResults[2].id}`, {
        headers: { token: userResults[0].getToken() }
      })
      .catch(error => {
        expect(error.status).to.equal(403);
        done();
      });
    });

  });
});

describe('GET /', function() {
  context('with semantically incorrect data', function() {
    it('return 401 when token is invalid', function(done) {
      axios.get(ARTICLE_API, {
        headers: { token: 'someinvalidtoken' }
      })
      .catch(error => {
        expect(error.status).to.equal(401);
        done();
      });
    });
  });

  context('with correct request data', function() {
    it('return 200 with public articles when token is not present', function(done) {
      axios.get(ARTICLE_API)
      .then(res => {
        for(const article of res.data.articles) {
          expect(article.isPublic).to.be.true;
        }
        expect(res.data.authors.length).to.equal(2);
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('return 200 with all articles when token user is admin', function(done) {
      axios.get(ARTICLE_API, {
        headers: { token: userResults[3].getToken() }
      })
      .then(res => {
        expect(res.data.articles.length).to.equal(4);
        expect(res.data.authors.length).to.equal(2);
        done();
      })
      .catch(err => {
        done(err);
      });
    });

    it('return 200 with public articles when token user is not admin', function(done) {
      axios.get(ARTICLE_API, {
        headers: { token: userResults[2].getToken() }
      })
      .then(res => {
        for(const article of res.data.articles) {
          expect(article.isPublic).to.be.true;
        }
        expect(res.data.authors.length).to.equal(2);
        done();
      })
      .catch(err => {
        done(err);
      });
    });
  });
});

after(function(done) {
  User.destroy({
    where: {
      email: {
        $like: '%@testmail.com%'
      }
    }
  }).then(res => {
    done();
  }).catch(err => {
    done(err);
  })
});
})
