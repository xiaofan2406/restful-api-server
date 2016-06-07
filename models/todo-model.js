
module.exports = (sequelize, DataTypes) => {
  const Todo = sequelize.define('Todo', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    freezeTableName: true, // stop Sequelize automatically name tables
    tableName: 'todos',
    instanceMethods: {

    },
    classMethods: {
      associate(models) {
        Todo.belongsTo(models.User, {
          foreignKey: {
            name: 'ownerId',
            allowNull: false
          },
          onDelete: 'cascade'
        });
      },
      createSingle(title, user) {
        return new Promise((resolve, reject) => {
          if (user.isAbleToCreateTodo) {
            const forbiddenError = new Error('Forbidden');
            forbiddenError.status = 403;
            return reject(forbiddenError);
          }
          resolve(this.create({ title }));
        });
      }
    },
    hooks: {
    }
  });

  return Todo;
};
