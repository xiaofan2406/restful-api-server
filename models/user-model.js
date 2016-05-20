const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt-config').JWT_SECRET;

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
    }
  }, {
    freezeTableName: true, // stop Sequelize automatically name tables
    tableName: 'user',
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
        // token expires in 30 minutes
        return jwt.sign({ sub: this.id, iat: timestamp }, JWT_SECRET, { expiresIn: 60 * 30 });
      }
    },
    hooks: {
      beforeUpdate(user) {
        hashPassword(user);
      },
      beforeCreate(user) {
        hashPassword(user);
      }
    }
  });

  return User;
};
