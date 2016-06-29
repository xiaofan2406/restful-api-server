import { type as userType } from '../constants/user-constants.js';

export const sampleUsersData = [{
  email: 'david@testmail.com',
  displayName: 'david@testmail.com',
  password: '123',
  activated: true,
  type: userType.NORMAL
}, {
  email: 'alex@testmail.com',
  displayName: 'alex@testmail.com',
  password: '123',
  activated: true,
  type: userType.NORMAL
}, {
  email: 'tom@testmail.com',
  displayName: 'tom@testmail.com',
  password: '123',
  activated: false,
  type: userType.NORMAL
}, {
  email: 'admin@testmail.com',
  displayName: 'admin@testmail.com',
  password: '123',
  activated: true,
  type: userType.ADMIN
}];
