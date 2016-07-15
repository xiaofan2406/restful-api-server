import bcrypt from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt-config';
import { type, creation } from '../constants/user-constants.js';
import Error from '../helpers/errors';

const hashPassword = (user) => {
  user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
  // this asyncronous version dosen't really improve performance
  // bcrypt.genSalt(10, (err, salt) => {
  //   if (err) {
  //     throw err;
  //   }
  //   bcrypt.hash(user.password, salt, null, (hashErr, hash) => {
  //     if (hashErr) {
  //       throw hashErr;
  //     }
  //     user.password = hash;
  //     cb(null, user);
  //   });
  // });
};

export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    uniqueId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    activated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    type: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    creation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: creation.REGISTERED
    }
  }, {
    freezeTableName: true, // stop Sequelize automatically name tables
    tableName: 'users',
    paranoid: true,
    instanceMethods: {
      validPassword(password, cb) {
        bcrypt.compare(password, this.password, (err, isMatch) => {
          if (err) {
            return cb(err);
          }
          return cb(null, isMatch);
        });
      },
      getToken() {
        const timestamp = new Date().getTime();
        return jwt.sign({ sub: this.id, iat: timestamp }, JWT_SECRET);
      },
      isValid() {
        return this.activated;
      },
      isAdmin() {
        return this.isValid() && this.type === type.ADMIN;
      },
      isAbleToCreateArticle() {
        return this.activated;
      },
      isAbleToCreateTodo() {
        return this.activated;
      },
      selfie() {
        return {
          email: this.email,
          username: this.username,
          activated: this.activated,
          type: this.type,
          updatedAt: this.updatedAt.toISOString(),
          createdAt: this.createdAt.toISOString()
        };
      },
      publicInfo() {
        return {
          username: this.username,
          activated: this.activated
        };
      }
    },
    classMethods: {
      /**
       * return an object with key as the name of the field and the value as the validator function
       * the fields returned should be editable through front-end
       * the validator function is defined in `helpers/validator.js`
       */
      fieldsValidator() {
        return {
          email: 'isEmail',
          password: 'validPassword',
          username: 'validUsername',
          uniqueId: 'isUUID',
          activated: 'isBoolean',
          type: 'validUserType'
        };
      },
      _adminableFields() {
        return [
          'email',
          'username',
          'password',
          'activated',
          'type'
        ];
      },
      _updatableFields() {
        return [
          'email',
          'password',
          'username'
        ];
      },
      _creationFields() {
        return [
          'email',
          'password',
          'username'
        ];
      },
      _getAuthorizedFields(user) { // TODO rewrite this when supports es6
        if (user && user.isAdmin()) {
          return this._adminableFields();
        }
        if (user && user.isValid()) {
          return this._updatableFields();
        }
        return [];
      },
      createSingle(userData, httpUser = null) {
        // safe assumption: userData has email and password fields
        return new Promise((resolve, reject) => {
          const isCreation = httpUser && httpUser.isAdmin();
          const fields = isCreation ?
                        this._adminableFields() :
                        this._creationFields();
          const requestFields = Object.keys(userData);
          for (const field of requestFields) {
            if (fields.indexOf(field) === -1) {
              return reject(Error(403, 'No permission to speical fields'));
            }
          }
          if (!userData.hasOwnProperty('username')) {
            userData.username = userData.email;
          }
          this.findByEmail(userData.email)
          .then(user => {
            if (user) {
              return reject(Error(409, 'Email has been registered already'));
            }
            if (isCreation) {
              userData.creation = creation.CREATED;
            }
            return resolve(this.create(userData));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      _operateOn(user, httpUser) {
        return new Promise((resolve, reject) => {
          if (!user) {
            return reject(Error(412, 'Requested user does not exist'));
          }
          if (!httpUser.isAdmin() && httpUser.id !== user.id) {
            return reject(Error(403, 'User does not have right to operate on requested user'));
          }
          return resolve(user);
        });
      },
      updateSingle(name, value, updates, httpUser) {
        return new Promise((resolve, reject) => {
          const fields = this._getAuthorizedFields(httpUser);
          const requestFields = Object.keys(updates);
          for (const field of requestFields) {
            if (fields.indexOf(field) === -1) {
              return reject(Error(403, 'Invalid field in request data'));
            }
          }
          const func = this._getFuncName(name);
          this[func](value)
          .then(user => {
            return this._operateOn(user, httpUser);
          })
          .then(user => {
            return user.update(updates);
          })
          .then(user => {
            return resolve(user);
          })
          .catch(error => {
            if (error.name === 'SequelizeUniqueConstraintError') {
              return reject(Error(409, 'Unique field violation'));
            }
            return reject(error);
          });
        });
      },
      deleteSingle(name, value, httpUser) {
        return new Promise((resolve, reject) => {
          const func = this._getFuncName(name);
          this[func](value)
          .then(user => {
            return this._operateOn(user, httpUser);
          })
          .then(user => {
            return resolve(user.destroy());
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      activateAccount(email, uniqueId) {
        return new Promise((resolve, reject) => {
          this.findByEmail(email)
          .then(httpUser => {
            if (!httpUser) {
              return reject(Error(401, 'Email is not registered'));
            }
            if (email !== httpUser.email || uniqueId !== httpUser.uniqueId) {
              return reject(Error(401, 'Email and unique Id does not match'));
            }
            if (httpUser.activated) {
              return reject(Error(409, 'Account was already activated'));
            }
            if (httpUser.deletedAt) {
              httpUser.restore()
              .then(() => {
                return resolve(httpUser.update({ activated: true }));
              });
            } else {
              return resolve(httpUser.update({ activated: true }));
            }
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      resetPassword(email, uniqueId, password) {
        return new Promise((resolve, reject) => {
          this.findByEmail(email)
          .then(httpUser => {
            if (!httpUser) {
              return reject(Error(401, 'Email is not registered'));
            }
            if (email !== httpUser.email || uniqueId !== httpUser.uniqueId) {
              return reject(Error(401, 'Email and unique Id does not match'));
            }
            return resolve(httpUser.update({ password }));
          }).catch(error => {
            return reject(error);
          });
        });
      },
      getSingle(name, value, httpUser) {
        return new Promise((resolve, reject) => {
          const func = this._getFuncName(name);
          this[func](value)
          .then(user => {
            if (!user) {
              return reject(Error(412, 'Requested user does not exist'));
            }
            if (httpUser && httpUser.isAdmin()) {
              return resolve(user.selfie());
            }
            if (httpUser && httpUser.id === user.id) {
              return resolve(user.selfie());
            }
            return resolve(user.publicInfo());
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getAll(httpUser) {
        return new Promise((resolve, reject) => {
          if (!httpUser.isValid()) {
            return reject(Error(401, 'You account is not verified'));
          }
          this.findAll()
          .then(users => {
            const usersData = [];
            for (const user of users) {
              usersData.push(user.publicInfo());
            }
            return resolve(usersData);
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      findByEmail(email) {
        return this.findOne({ where: { email }, paranoid: false });
      },
      findByUsername(username) {
        return this.findOne({ where: { username } });
      },
      _getFuncName(name) {
        switch (name) {
          case 'id':
            return 'findById';
          case 'username':
            return 'findByUsername';
          case 'email':
            return 'findByEmail';
          default:
            return 'findById';
        }
      }
    },
    hooks: {
      beforeCreate(user) {
        hashPassword(user);
      },
      beforeUpdate(user, opts) {
        if (opts.fields.indexOf('password') > -1) {
          hashPassword(user);
        }
      },
      beforeDestroy(user) {
        return user.update({ activated: false });
      }
    }
  });

  return User;
};
