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
    shortname: {
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
      isAbleToCreateArticle() {
        return this.activated;
      },
      isAbleToCreateTodo() {
        return this.activated;
      },
      selfie() { // all public information to return to user
        return {
          email: this.email,
          shortname: this.shortname,
          activated: this.activated,
          createdAt: this.createdAt.toISOString()
        };
      },
      isAdmin() {
        return this.type === type.ADMIN;
      },
      publicInfo() {
        return {
          shortname: this.shortname,
          activated: this.activated
        };
      }
    },
    classMethods: {
      _validFields() {
        return [
          'email',
          'password',
          'shortname',
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
          'password',
          'shortname',
          'type'
        ];
      },
      _updatableFields() {
        return [
          'password',
          'shortname'
        ];
      },
      createSingle(userData, httpUser = null) {
        // safe assumption: userData has email and password fields
        return new Promise((resolve, reject) => {
          const _updatableFields = this._updatableFields();
          const requestFields = Object.keys(userData);
          for (const field of requestFields) {
            if (_updatableFields.indexOf(field) === -1) {
              return reject(Error(400, 'Invalid field in request data'));
            }
          }
          if (!userData.hasOwnProperty('shortname')) {
            userData.shortname = userData.email.replace('@', '.');
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
      editSingle(email, updates, httpUser) {
        return new Promise((resolve, reject) => {
          const _updatableFields = this._updatableFields();
          const requestFields = Object.keys(updates);
          for (const field of requestFields) {
            if (_updatableFields.indexOf(field) === -1) {
              return reject(Error(400, 'Invalid field in request data'));
            }
          }
          this.findByEmail(email)
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
      deleteSingle(email, httpUser) {
        return new Promise((resolve, reject) => {
          this.findByEmail(email)
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
      getSingle(email, httpUser) {
        return new Promise((resolve, reject) => {
          this.findByEmail(email)
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
          if (!httpUser.activated) {
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
