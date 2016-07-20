import Error from '../helpers/errors';
import { isEmptyString } from '../helpers/validator-funcs';

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
      defaultValue: null,
      allowNull: true
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
          completed: this.completed,
          ownerId: this.ownerId
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
      fieldsValidator() {
        return {
          id: 'isUUID',
          title: 'isTodoTitle',
          content: 'isTodoContent',
          completed: 'isBoolean',
          dueDate: 'isISODateString',
          scope: 'isTodoScope',
          scopeDate: 'isISODateString'
        };
      },
      fieldsSanitizer() {
        return ['content'];
      },
      __contentSanitizer(title) {
        if (isEmptyString(title)) {
          return null;
        }
        return title;
      },
      _getAuthorizedFields(httpUser) { // TODO rewrite this when supports es6
        if (httpUser && httpUser.hasTodoPermission()) {
          return this._updatableFields();
        }
        return [];
      },
      _creationFields() {
        return [
          'title',
          'completed',
          'content',
          'dueDate',
          'scope',
          'scopeDate'
        ];
      },
      _updatableFields() {
        return [
          'title',
          'completed',
          'content',
          'dueDate',
          'scope',
          'scopeDate'
        ];
      },
      createSingle(todoData, httpUser) {
        return new Promise((resolve, reject) => {
          const fields = this._creationFields();
          const requestFields = Object.keys(todoData);
          for (const field of requestFields) {
            if (fields.indexOf(field) === -1) {
              return reject(Error(403, 'No permission to speical fields'));
            }
          }
          if (!httpUser.hasTodoPermission()) {
            return reject(Error(403, 'User does not have permission to create new todo'));
          }
          todoData.ownerId = httpUser.id;
          return resolve(this.create(todoData));
        });
      },
      _operateOn(todo, httpUser) {
        return new Promise((resolve, reject) => {
          if (!todo) {
            return reject(Error(412, 'Requested todo does not exist'));
          }
          if (!httpUser.hasTodoPermission()) {
            return reject(Error(403, 'User does not have permission for resource Todo'));
          }
          if (httpUser.id !== todo.ownerId) {
            return reject(Error(403, 'User does not have permission to operate on requested todo'));
          }
          return resolve(todo);
        });
      },
      editSingle(id, updates, httpUser) {
        return new Promise((resolve, reject) => {
          const fields = this._getAuthorizedFields(httpUser);
          const requestFields = Object.keys(updates);
          for (const field of requestFields) {
            if (fields.indexOf(field) === -1) {
              return reject(Error(403, 'No permission to speical fields'));
            }
          }
          this.findById(id)
          .then(todo => {
            return this._operateOn(todo, httpUser);
          })
          .then(todo => {
            return resolve(todo.update(updates));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      deleteSingle(id, httpUser) {
        return new Promise((resolve, reject) => {
          this.findById(id)
          .then(todo => {
            return this._operateOn(todo, httpUser);
          })
          .then(todo => {
            return resolve(todo.destroy());
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getSingle(id, httpUser) {
        return new Promise((resolve, reject) => {
          this.findById(id)
          .then(todo => {
            return this._operateOn(todo, httpUser);
          })
          .then(todo => {
            return resolve(todo.selfie());
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getAll(filter, httpUser) {
        return new Promise((resolve, reject) => {
          const condition = {
            ownerId: httpUser.id,
            ...filter
          };
          this.findAll({ where: condition })
          .then(todos => {
            const todosData = todos.map(todo => todo.selfie());
            return resolve(todosData);
          })
          .catch(error => {
            return reject(error);
          });
        });
      }
    },
    hooks: {
      beforeUpdate(todo, opts) {
        const sanitizers = this.fieldsSanitizer();
        for (const field of opts.fields) {
          if (sanitizers.indexOf(field) > -1) {
            const fieldSanitizer = `__${field}Sanitizer`;
            todo[field] = this[fieldSanitizer](todo[field]);
          }
        }
      }
    }
  });

  return Todo;
};
