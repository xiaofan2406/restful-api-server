// const expect = require('chai').expect;
// const bcrypt = require('bcrypt-nodejs');
// const axios = require('axios');
// const { User, Todo } = require('../models');
// const { SERVER_URL } = require('../config/app-config');
// const TODO_API = `${SERVER_URL}/api/todo`;
//
// const { sampleUsersData } = require('./sample-data');
// // TODO edge cases?
//
// context('/api/todo', function() {
//
// let sampleUsers, sampleTodos;
// const title = 'an article title';
// const content = 'the content of an article';
//
// before('populate fake data', function(done) {
//   User.bulkCreate(sampleUsersData, { returning: true })
//   .then(result => {
//     sampleUsers = result;
//     const sampleTodosData = [{
//       title: 'buy milk',
//       completed: false,
//       ownerId: sampleUsers[0].id
//     }, {
//       title: 'get post',
//       completed: false,
//       ownerId: sampleUsers[0].id
//     }, {
//       title: 'play games',
//       completed: true,
//       ownerId: sampleUsers[0].id
//     }, {
//       title: 'clean room',
//       completed: false,
//       ownerId: sampleUsers[0].id
//     }, {
//       title: 'buy milk',
//       completed: false,
//       ownerId: sampleUsers[0].id
//     }, {
//       title: 'get post',
//       completed: false,
//       ownerId: sampleUsers[0].id
//     }, {
//       title: 'play games',
//       completed: true,
//       ownerId: sampleUsers[0].id
//     }, {
//       title: 'clean room',
//       completed: false,
//       ownerId: sampleUsers[0].id
//     }]
//     return Todo.bulkCreate(sampleTodosData);
//   })
//   .then(result => {
//     sampleTodos = result;
//     done();
//   })
//   .catch(error => {
//     done(error);
//   });
// });
//
// describe('POST /', function() {
//   context('with semantically incorrect data', function() {
//
//   });
//
//   context('with mal-formed request data', function() {
//
//   });
//
//   context('with correct request data', function() {
//
//   });
// });
//
// describe('DELETE /:id', function() {
//   context('with semantically incorrect data', function() {
//
//   });
//
//   context('with correct request data', function() {
//
//   });
// });
//
// describe('GET /:id', function() {
//   context('with correct request data', function() {
//
//   });
//
//   context('with semantically incorrect data', function() {
//
//   });
// });
//
// describe('GET /', function() {
//   context('with semantically incorrect data', function() {
//
//   });
//
//   context('with correct request data', function() {
//
//   });
// });
//
// after(function(done) {
//   User.removeSampleUsers().then(res => {
//     done();
//   }).catch(err => {
//     done(err);
//   });
// });
//
// })
