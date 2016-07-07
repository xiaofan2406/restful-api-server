import { type as userType } from '../constants/user-constants.js';

export const sampleUsersData = [{
  email: 'david@testmail.com',
  shortname: 'david@testmail.com',
  password: '123',
  activated: true,
  type: userType.NORMAL
}, {
  email: 'alex@testmail.com',
  shortname: 'alex@testmail.com',
  password: '123',
  activated: true,
  type: userType.NORMAL
}, {
  email: 'tom@testmail.com',
  shortname: 'tom@testmail.com',
  password: '123',
  activated: false,
  type: userType.NORMAL
}, {
  email: 'admin@testmail.com',
  shortname: 'admin@testmail.com',
  password: '123',
  activated: true,
  type: userType.ADMIN
}];
