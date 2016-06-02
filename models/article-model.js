
module.exports = (sequelize, DataTypes) => {
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
    instanceMethods: {
      selfie() {
        return {
          id: this.id,
          title: this.title,
          content: this.content,
          categories: this.categories,
          tags: this.tags,
          isPublic: this.isPublic
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
      findAllPublic() {
        return this.findAll({ where: { isPublic: true } });
      },
      createTestArticles(startingAuthorId) {
        const articles = [];
        for (let i = 0; i < 5; i++) {
          articles.push({
            title: `article number ${i}`,
            content: `${i} an interesting article ${i}`,
            authorId: startingAuthorId + i,
            isPublic: false
          });
          articles.push({
            title: `public article number ${i}`,
            content: `${i} an interesting public article ${i}`,
            authorId: startingAuthorId + i,
            isPublic: true
          });
        }
        return this.bulkCreate(articles, {
          individualHooks: true,
          validate: true
        });
      },
      createSingle(articleData) {
        const err = new Error();
        return new Promise((resolve, reject) => {
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
      editSingle(id, authorId, updates) {
        const err = new Error();
        return new Promise((resolve, reject) => {
          let currentArticle;
          this.findById(id)
          .then(article => {
            if (!article) {
              err.message = 'Article does not exist';
              err.status = 412;
              return reject(err);
            }
            if (authorId !== article.authorId) {
              err.message = 'Forbidden';
              err.status = 403;
              return reject(err);
            }
            if (updates.authorId) {
              err.message = 'Cannot change author';
              err.status = 403;
              return reject(err);
            }
            currentArticle = article;
            return this.findOne({
              where: { idWithAuthor: `U${authorId}A${updates.title}`, id: { $not: article.id } }
            });
          })
          .then(dup => {
            if (dup) {
              err.message = 'Duplicate error';
              err.status = 409;
              return reject(err);
            }
            if (updates.title) {
              updates.idWithAuthor = `U${authorId}A${updates.title}`;
            }
            return resolve(currentArticle.update(updates));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      removeSingle(id) {
        
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
