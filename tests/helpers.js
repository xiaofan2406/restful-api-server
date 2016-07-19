import { type, resources } from '../constants/user-constants.js';

export const sampleUsersData = [{
  email: 'normal@testmail.com',
  username: 'normal@testmail.com',
  password: 'normalpassword1',
  activated: true,
  type: type.NORMAL
}, {
  email: 'notactivate@testmail.com',
  username: 'notactivate@testmail.com',
  password: 'notactivatepassword1',
  activated: false,
  type: type.NORMAL
}, {
  email: 'super@testmail.com',
  username: 'super@testmail.com',
  password: 'superpassword1',
  activated: true,
  type: type.ADMIN
}, {
  email: 'notodo@testmail.com',
  username: 'notodo@testmail.com',
  password: 'notodopassword1',
  activated: true,
  resources: [resources.ARTICLE],
  type: type.NORMAL
}, {
  email: 'noarticle@testmail.com',
  username: 'noarticle@testmail.com',
  password: 'noarticlepassword1',
  activated: true,
  resources: [resources.TODO],
  type: type.NORMAL
}];

export const isDateEqual = (first, second) => {
  const firstValue = first.getFullYear() + first.getMonth() + first.getDate();
  const secondValue = second.getFullYear() + second.getMonth() + second.getDate();
  return firstValue === secondValue;
};
