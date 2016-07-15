import { type as userType } from '../constants/user-constants.js';

export const sampleUsersData = [{
  email: 'normal1@testmail.com',
  username: 'normal1@testmail.com',
  password: 'normal1password',
  activated: true,
  type: userType.NORMAL
}, {
  email: 'normal2@testmail.com',
  username: 'normal2@testmail.com',
  password: 'normal2password',
  activated: false,
  type: userType.NORMAL
}, {
  email: 'notactivate@testmail.com',
  username: 'notactivate@testmail.com',
  password: 'notactivatepassword1',
  activated: false,
  type: userType.NORMAL
}, {
  email: 'admin@testmail.com',
  username: 'admin@testmail.com',
  password: 'adminpassword1',
  activated: true,
  type: userType.ADMIN
}, {
  email: 'normal3@testmail.com',
  username: 'normal3@testmail.com',
  password: 'normal3password',
  activated: true,
  type: userType.NORMAL
}];

export const isDateEqual = (first, second) => {
  const firstValue = first.getFullYear() + first.getMonth() + first.getDate();
  const secondValue = second.getFullYear() + second.getMonth() + second.getDate();
  return firstValue === secondValue;
};
