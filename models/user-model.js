const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt-config').JWT_SECRET;
const { type } = require('../constants/user-constants.js');
const Error = require('../constants/errors');
/**
 * This is a sample Sequelize model
 */

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

module.exports = (sequelize, DataTypes) => {
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
    displayName: {
      type: DataTypes.STRING,
      allowNull: false
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
          displayName: this.displayName,
          activated: this.activated,
          createdAt: this.createdAt.toISOString()
        };
      },
      isAdmin() {
        return this.type === type.ADMIN;
      },
      publicSnapshot() {
        return {
          displayName: this.displayName
        };
      }
    },
    classMethods: {
      validFields() {
        return [
          'email',
          'password',
          'displayName',
          'UUID',
          'activated',
          'type'
        ];
      },
      editableFields() {
        return [
          'email',
          'password',
          'displayName',
          'activated',
          'type'
        ];
      },
      activateAccount(email, hash) {
        return new Promise((resolve, reject) => {
          this.findByEmail(email).then(user => {
            if (!user) {
              return reject(Error(401, 'Email is not registered'));
            }
            if (user.activated === true) {
              return reject(Error(409, 'Account was already activated'));
            }
            if (email !== user.email || hash !== user.UUID) {
              return reject(Error(401, 'Email and hash does not match'));
            }
            return resolve(user.update({ activated: true }));
          }).catch(error => {
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
