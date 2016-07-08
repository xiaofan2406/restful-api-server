import bcrypt from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt-config';
import { type } from '../constants/user-constants.js';
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
    UUID: {
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
    }
  }, {
    freezeTableName: true, // stop Sequelize automatically name tables
    tableName: 'users',
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
      selfie() { // all public information to return to user
        return {
          email: this.email,
          username: this.username,
          activated: this.activated,
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
      _validFields() {
        return [
          'email',
          'password',
          'username',
          'UUID',
          'activated',
          'type',
          'createdAt',
          'updatedAt'
        ];
      },
      _adminableFields() {
        return [
          'email',
          'username',
          'activated',
          'type'
        ];
      },
      _updatableFields() {
        return [
          'email',
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
          const fields = httpUser && httpUser.isAdmin() ?
                        this._adminableFields() :
                        this._creationFields();
          const requestFields = Object.keys(userData);
          for (const field of requestFields) {
            if (fields.indexOf(field) === -1) {
              return reject(Error(400, 'Invalid field in request data'));
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
            if (httpUser && httpUser.isAdmin()) {
              userData.activated = true;
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
          if (!httpUser.isAdmin() && httpUser.email !== user.email) {
            return reject(Error(403, 'User does not have right to operate on requested user'));
          }
          return resolve(user);
        });
      },
      updateSingle(id, updates, httpUser) {
        return new Promise((resolve, reject) => {
          const fields = this._getAuthorizedFields(httpUser);
          const requestFields = Object.keys(updates);
          for (const field of requestFields) {
            if (fields.indexOf(field) === -1) {
              return reject(Error(400, 'Invalid field in request data'));
            }
          }
          this.findById(id)
          .then(user => {
            return this._operateOn(user, httpUser);
          })
          .then(user => {
            return resolve(user.update(updates));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      updateSingleByUsername(username, updates, httpUser) {
        return new Promise((resolve, reject) => {
          const fields = this._getAuthorizedFields(httpUser);
          const requestFields = Object.keys(updates);
          for (const field of requestFields) {
            if (fields.indexOf(field) === -1) {
              return reject(Error(400, 'Invalid field in request data'));
            }
          }
          this.findByUsername(username)
          .then(user => {
            return this._operateOn(user, httpUser);
          })
          .then(user => {
            return resolve(user.update(updates));
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      deleteSingle(id, httpUser) {
        return new Promise((resolve, reject) => {
          this.findById(id)
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
      deleteSingleByUsername(username, httpUser) {
        return new Promise((resolve, reject) => {
          this.findByUsername(username)
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
      activateAccount(email, hash) {
        return new Promise((resolve, reject) => {
          this.findByEmail(email).then(httpUser => {
            if (!httpUser) {
              return reject(Error(401, 'Email is not registered'));
            }
            if (httpUser.activated) {
              return reject(Error(409, 'Account was already activated'));
            }
            if (email !== httpUser.email || hash !== httpUser.UUID) {
              return reject(Error(401, 'Email and hash does not match'));
            }
            return resolve(httpUser.update({ activated: true }));
          }).catch(error => {
            return reject(error);
          });
        });
      },
      getSingle(id, httpUser) {
        return new Promise((resolve, reject) => {
          this.findById(id)
          .then(user => {
            return this._operateOn(user, httpUser);
          })
          .then(user => {
            return resolve(user.selfie());
          })
          .catch(error => {
            return reject(error);
          });
        });
      },
      getSingleByUsername(username, httpUser) {
        return new Promise((resolve, reject) => {
          this.findByUsername(username)
          .then(user => {
            return this._operateOn(user, httpUser);
          })
          .then(user => {
            return resolve(user.selfie());
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
        return this.findOne({ where: { email } });
      },
      findByUsername(username) {
        return this.findOne({ where: { username } });
      }
    },
    hooks: {
      beforeCreate(user) {
        hashPassword(user);
      }
    }
  });

  return User;
};
