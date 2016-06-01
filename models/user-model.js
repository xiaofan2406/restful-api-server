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
      activateAccount(email, hash) {
        return new Promise((resolve, reject) => {
          const err = new Error();
          if (this.activated === true) {
            err.message = 'Account was already activated.';
            err.status = 409;
            return reject(err);
          }
          if (email !== this.email || hash !== this.UUID) {
            err.message = 'Email and hash did not match';
            err.status = 401;
            return reject(err);
          }
          return resolve(this.update({ activated: true }));
        });
      }
    },
    classMethods: {
      findByEmail(email) {
        return this.findOne({ where: { email } });
      },
      createTestUsers() {
        const users = [];
        for (let i = 0; i < 6; i++) {
          users.push({
            email: `testaccount${i}@mail.com`,
            password: 'password',
            displayName: `testaccount${i}@mail.com`,
            activated: (i !== 5),
            isAdmin: (i === 4)
          });
        }
        return this.bulkCreate(users, { returning: true });
      },
      removeTestUsers() {
        return this.destroy({
          where: { email: { $like: '%testaccount%' } }
        });
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
