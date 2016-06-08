
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
      validFields() {
        return [
          'title',
          'completed',
          'ownerId'
        ];
      },
      editableFields() {
        return [
          'title',
          'completed'
        ];
      },
      createSingle(todoData, user) {
        return new Promise((resolve, reject) => {
          const err = new Error();
          const validFields = this.validFields();
          const requestFields = Object.keys(todoData);
          for (const field of requestFields) {
            if (validFields.indexOf(field) === -1) {
              err.message = 'Invalid field in request data';
              err.status = 400;
              return reject(err);
            }
          }
          if (!user.isAbleToCreateTodo()) {
            err.message = 'Forbidden';
            err.status = 403;
            return reject(err);
          }
          todoData.ownerId = user.id;
          return resolve(this.create(todoData));
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
            return resolve(todo.update(updates));
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
      },
      getSingle(id, user) {
        return new Promise((resolve, reject) => {
          const err = new Error();
          this.findById(id)
          .then(todo => {
            if (!todo) {
              err.message = 'Does not exist';
              err.status = 412;
              return reject(err);
            }
            if (user.id !== todo.ownerId) {
              err.message = 'Forbidden';
              err.status = 403;
              return reject(err);
            }
            return todo.selfie();
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
