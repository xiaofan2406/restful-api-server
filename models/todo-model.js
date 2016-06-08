
module.exports = (sequelize, DataTypes) => {
  const Todo = sequelize.define('Todo', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
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
      selfie() {
        return {
          id: this.id,
          title: this.title,
          completed: this.completed
        };
      }
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
      createSingle(todoData, user) {
        return new Promise((resolve, reject) => {
          if (!user.isAbleToCreateTodo()) {
            const forbiddenError = new Error('Forbidden');
            forbiddenError.status = 403;
            return reject(forbiddenError);
          }
          return resolve(this.create(todoData));
        });
      },
      editSingle(id, updates, user) {
        const err = new Error();
        return new Promise((resolve, reject) => {
          this.findById(id)
          .then(todo => {
            if (!todo) {
              err.message = 'Todo does not exist';
              err.status = 412;
              return reject(err);
            }
            if (user.id !== todo.ownerId) {
              err.message = 'Forbidden';
              err.status = 403;
              return reject(err);
            }
            if (updates.ownerId) {
              err.message = 'Cannot change author';
              err.status = 403;
              return reject(err);
            }
            return resolve(todo.update(updates));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      deleteSingle(id, user) {
        const err = new Error();
        return new Promise((resolve, reject) => {
          this.findById(id)
          .then(todo => {
            if (!todo) {
              err.message = 'Todo does not exist';
              err.status = 412;
              return reject(err);
            }
            if (user.id !== todo.ownerId) {
              err.message = 'Forbidden';
              err.status = 403;
              return reject(err);
            }
            return resolve(todo.destroy());
          })
          .catch(error => {
            return reject(error);
          });
        });
      }
    },
    hooks: {
    }
  });

  return Todo;
};
