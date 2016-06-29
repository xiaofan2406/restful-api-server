export default (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    categories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    idWithAuthor: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    freezeTableName: true, // stop Sequelize automatically name tables
    tableName: 'articles',
    paranoid: true,
    instanceMethods: {
      selfie() {
        return {
          id: this.id,
          title: this.title,
          content: this.content,
          categories: this.categories,
          tags: this.tags,
          isPublic: this.isPublic,
          authorId: this.authorId
        };
      }
    },
    classMethods: {
      associate(models) {
        Article.belongsTo(models.User, {
          foreignKey: {
            name: 'authorId',
            allowNull: false
          },
          onDelete: 'cascade'
        });
      },
      validFields() {
        return [
          'title',
          'content',
          'categories',
          'tags',
          'idWithAuthor',
          'isPublic',
          'authorId'
        ];
      },
      editableFields() { // by user edit
        return [
          'title',
          'content',
          'categories',
          'tags',
          'isPublic'
        ];
      },
      createSingle(articleData, user) {
        return new Promise((resolve, reject) => {
          const err = new Error();
          const validFields = this.validFields();
          const requestFields = Object.keys(articleData);
          for (const field of requestFields) {
            if (validFields.indexOf(field) === -1) {
              err.message = 'Invalid field in request data';
              err.status = 400;
              return reject(err);
            }
          }
          if (!user.isAbleToCreateArticle()) {
            err.message = 'User cannot create article';
            err.status = 403;
            return reject(err);
          }
          articleData.authorId = user.id;
          this.findOne({ where: { idWithAuthor: `U${articleData.authorId}A${articleData.title}` } })
          .then(dup => {
            if (dup) {
              err.message = 'Duplicate error';
              err.status = 409;
              return reject(err);
            }
            return resolve(this.create(articleData));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      editSingle(id, updates, user) {
        return new Promise((resolve, reject) => {
          const err = new Error();
          const editableFields = this.editableFields();
          const requestFields = Object.keys(updates);
          for (const field of requestFields) {
            if (editableFields.indexOf(field) === -1) {
              err.message = 'Un-editable field in request data';
              err.status = 400;
              return reject(err);
            }
          }
          let currentArticle;
          this.findById(id)
          .then(article => {
            if (!article) {
              err.message = 'Article does not exist';
              err.status = 412;
              return reject(err);
            }
            if (user.id !== article.authorId) {
              err.message = 'Forbidden';
              err.status = 403;
              return reject(err);
            }
            currentArticle = article;
            return this.findOne({
              where: { idWithAuthor: `U${user.id}A${updates.title}`, id: { $not: article.id } }
            });
          })
          .then(dup => {
            if (dup) {
              err.message = 'Duplicate error';
              err.status = 409;
              return reject(err);
            }
            if (updates.title) {
              updates.idWithAuthor = `U${currentArticle.id}A${updates.title}`;
            }
            return resolve(currentArticle.update(updates));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      deleteSingle(id, user) {
        return new Promise((resolve, reject) => {
          const err = new Error();
          this.findById(id)
          .then(article => {
            if (!article) {
              err.message = 'Article does not exist';
              err.status = 412;
              return reject(err);
            }
            if (user.id !== article.authorId) {
              err.message = 'Forbidden';
              err.status = 403;
              return reject(err);
            }
            return resolve(article.destroy());
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getSingle(id, user) {
        return new Promise((resolve, reject) => {
          const err = new Error();
          let foundArticle;
          this.findById(id)
          .then(article => {
            if (!article) {
              err.message = 'Article does not exist';
              err.status = 412;
              return reject(err);
            }
            if (!article.isPublic && (!user || article.authorId !== user.id)) {
              err.message = 'Forbidden';
              err.status = 403;
              return reject(err);
            }
            const User = sequelize.models.User;
            foundArticle = article;
            return User.findById(article.authorId);
          })
          .then(author => {
            return resolve([foundArticle, author]);
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getArticles(user) {
        let options = { where: { isPublic: true } };
        if (user && user.isAdmin()) {
          options = {};
        }
        return new Promise((resolve, reject) => {
          let foundArticles;
          this.findAll(options)
          .then(articles => {
            const authorIds = articles.map(article => {
              return article.authorId;
            });
            foundArticles = articles;
            const User = sequelize.models.User;
            return User.findAll({ where: { id: authorIds } });
          })
          .then(authors => {
            return resolve([foundArticles, authors]);
          })
          .catch(error => {
            return reject(error);
          });
        });
      }
    },
    hooks: {
      beforeValidate(article) {
        article.idWithAuthor = `U${article.authorId}A${article.title}`;
      }
    }
  });

  return Article;
};
