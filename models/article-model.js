
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

    },
    classMethods: {
      associate(models) {
        Article.belongsTo(models.User, {
          foreignKey: {
            name: 'userId',
            allowNull: false
          },
          onDelete: 'cascade'
        });
      },
      findAllPublic() {
        return this.findAll({ where: { isPublic: true } });
      },
      createTestArticles(startingUserId) {
        const articles = [];
        for (let i = 0; i < 5; i++) {
          articles.push({
            title: `ariticle number ${i}`,
            content: `${i} an interesting ariticle ${i}`,
            userId: startingUserId + i,
            isPublic: false
          });
          articles.push({
            title: `public ariticle number ${i}`,
            content: `${i} an interesting public ariticle ${i}`,
            userId: startingUserId + i,
            isPublic: true
          });
        }
        return this.bulkCreate(articles, {
          individualHooks: true,
          validate: true
        });
      }
    },
    hooks: {
      beforeValidate(article) {
        article.idWithAuthor = `U${article.userId}A${article.title}`;
      }
    }
  });

  return Article;
};
