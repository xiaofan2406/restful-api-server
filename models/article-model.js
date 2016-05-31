
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
          }
        });
      }
    },
    hooks: {
      beforeCreate(article) {
      }
    }
  });

  return Article;
};
