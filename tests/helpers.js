const { type } = require('../constants/user-constants.js');

const sampleUsersData = [{
  email: 'david@testmail.com',
  displayName: 'david@testmail.com',
  password: '123',
  activated: true,
  type: type.NORMAL
}, {
  email: 'alex@testmail.com',
  displayName: 'alex@testmail.com',
  password: '123',
  activated: true,
  type: type.NORMAL
}, {
  email: 'tom@testmail.com',
  displayName: 'tom@testmail.com',
  password: '123',
  activated: false,
  type: type.NORMAL
}, {
  email: 'admin@testmail.com',
  displayName: 'admin@testmail.com',
  password: '123',
  activated: true,
  type: type.ADMIN
}];

module.exports = {
  sampleUsersData
};
