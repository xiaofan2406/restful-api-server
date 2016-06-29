import Error from '../helpers/errors';

export default (sequelize, DataTypes) => {
  const Todo = sequelize.define('Todo', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    content: {
      type: DataTypes.STRING(200),
      defaultValue: null,
      allowNull: true
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING,
      defaultValue: 'default',
      allowNull: false
    },
    scopeDate: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true
    }
  }, {
    freezeTableName: true, // stop Sequelize automatically name tables
    tableName: 'todos',
    instanceMethods: {
      selfie() {
        return {
          id: this.id,
          title: this.title,
          content: this.content,
          dueDate: this.dueDate,
          scope: this.scope,
          scopeDate: this.scopeDate,
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
          'ownerId',
          'dueDate',
          'scope',
          'scopeDate'
        ];
      },
      editableFields() {
        return [
          'title',
          'completed',
          'dueDate',
          'scope',
          'scopeDate'
        ];
      },
      createSingle(todoData, user) {
        return new Promise((resolve, reject) => {
          const validFields = this.validFields();
          const requestFields = Object.keys(todoData);
          for (const field of requestFields) {
            if (validFields.indexOf(field) === -1) {
              return reject(Error(400, 'Invalid field in request data'));
            }
          }
          if (!user.isAbleToCreateTodo()) {
            return reject(Error(403, 'User does not have right to create new todo'));
          }
          todoData.ownerId = user.id;
          return resolve(this.create(todoData));
        });
      },
      _operateOn(todo, user) {
        return new Promise((resolve, reject) => {
          if (!todo) {
            return reject(Error(412, 'Requested todo does not exist'));
          }
          if (user.id !== todo.ownerId) {
            return reject(Error(403, 'User does not have right to operate on requested todo'));
          }
          return resolve(todo);
        });
      },
      editSingle(id, updates, user) {
        return new Promise((resolve, reject) => {
          const editableFields = this.editableFields();
          const requestFields = Object.keys(updates);
          for (const field of requestFields) {
            if (editableFields.indexOf(field) === -1) {
              return reject(Error(400, 'Invalid field in request data'));
            }
          }
          this.findById(id)
          .then(todo => {
            return this._operateOn(todo, user);
          })
          .then(todo => {
            return resolve(todo.update(updates));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      toggleSingle(id, user) {
        return new Promise((resolve, reject) => {
          this.findById(id)
          .then(todo => {
            return this._operateOn(todo, user);
          })
          .then(todo => {
            return resolve(todo.update({ completed: !todo.completed }));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      deleteSingle(id, user) {
        return new Promise((resolve, reject) => {
          this.findById(id)
          .then(todo => {
            return this._operateOn(todo, user);
          })
          .then(todo => {
            return resolve(todo.destroy());
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getSingle(id, user) {
        return new Promise((resolve, reject) => {
          this.findById(id)
          .then(todo => {
            return this._operateOn(todo, user);
          })
          .then(todo => {
            return resolve(todo.selfie());
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getAll(user) {
        return new Promise((resolve, reject) => {
          this.findAll({ where: { ownerId: user.id } })
          .then(todos => {
            const todosData = [];
            for (const todo of todos) {
              todosData.push(todo.selfie());
            }
            return resolve(todosData);
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getActive(user) {
        return new Promise((resolve, reject) => {
          this.findAll({ where: { ownerId: user.id, completed: false } })
          .then(todos => {
            const todosData = [];
            for (const todo of todos) {
              todosData.push(todo.selfie());
            }
            return resolve(todosData);
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getCompleted(user) {
        return new Promise((resolve, reject) => {
          this.findAll({ where: { ownerId: user.id, completed: true } })
          .then(todos => {
            const todosData = [];
            for (const todo of todos) {
              todosData.push(todo.selfie());
            }
            return resolve(todosData);
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
