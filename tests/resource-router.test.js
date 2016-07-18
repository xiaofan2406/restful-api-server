// /* global describe, it, context, before, beforeEach, after, afterEach */
// /* eslint-disable no-unused-expressions */
// import { expect } from 'chai';
// import axios from 'axios';
// import { SERVER_URL } from '../config/app-config';
// import { User, RESOURCE } from '../models';
// import { sampleUsersData } from './helpers';
// const RESOURCE_API = `${SERVER_URL}/api/RESOURCE`;
//
// context('/api/RESOURCE', () => {
//   let adminUser;
//   let normalUser;
//   let inavtiveUser;
//   before('create sample users', done => {
//     User.bulkCreate(sampleUsersData, { returning: true, individualHooks: true })
//     .then(users => {
//       normalUser = users[0];
//       inavtiveUser = users[1];
//       adminUser = users[2];
//       done();
//     })
//     .catch(err => {
//       done(err);
//     });
//   });
//
//   describe('POST /', () => {
//     context('with mal-formed request data', () => {
//
//     });
//
//     context('with semantically incorrect request data', () => {
//
//     });
//
//     context('with valid request data', () => {
//
//     });
//   });
//
//   describe('PATCH /:id', () => {
//     context('with mal-formed request data', () => {
//
//     });
//
//     context('with semantically incorrect request data', () => {
//
//     });
//
//     context('with valid request data', () => {
//
//     });
//   });
//
//   describe('GET /:id', () => {
//     context('with mal-formed request data', () => {
//
//     });
//
//     context('with semantically incorrect request data', () => {
//
//     });
//
//     context('with valid request data', () => {
//
//     });
//   });
//
//   describe('GET /', () => {
//     context('with mal-formed request data', () => {
//
//     });
//
//     context('with semantically incorrect request data', () => {
//
//     });
//
//     context('with valid request data', () => {
//
//     });
//   });
//
//   describe('DELETE /:id', () => {
//     context('with mal-formed request data', () => {
//
//     });
//
//     context('with semantically incorrect request data', () => {
//
//     });
//
//     context('with valid request data', () => {
//
//     });
//   });
//
//   after('clean up sample entries', done => {
//     User.destroy({
//       where: {
//         email: {
//           $like: '%@testmail.com%'
//         }
//       },
//       force: true
//     })
//     .then(() => {
//       done();
//     })
//     .catch(err => {
//       done(err);
//     });
//   });
// });
