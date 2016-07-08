/* global describe, it, context, before, after */
import { expect } from 'chai';
import axios from 'axios';
import { SERVER_URL } from '../config/app-config';
import { User } from '../models';
import { type } from '../constants/user-constants.js';
const USER_API = `${SERVER_URL}/api/todo`;

context('/api/user', () => {
  let admin;
  before('create an admin user', (done) => {
    User.create({
      username: 'Admin',
      email: 'admin@mail.com',
      password: 'adminpassword',
      activated: true,
      type: type.ADMIN
    }).then(user => {
      admin = user;
    }).catch(err => {
      done(err);
    });
  });

  describe('POST /', () => {
    context('with mal-formed request data', () => {
      it('should return error when email is not present');
      it('should return error when email is not in valid format');
      it('should return error when password is not present');
      it('should return error when password is not in valid format');
      it('should return error when unknown fields are present');
    });

    context('with valid request data', () => {
      // TODO how do i test registration email are sent
      context('when no token is not present', () => {
        it('should return 202 and default username with user publicInfo');
        it('should return 202 and given username with user publicInfo');
      });

      context('when token user is normal', () => {
        it('should return 202 and default username with user publicInfo');
        it('should return 202 and given username with user publicInfo');
      });

      context('when token user is admin', () => {
        it('should return 201 with user selfie when activated is set to true');
        it('should return 202 with user selfie when activated is not specified');
        it('should default username to email when username was not given');
        it('should set the correct username when given');
        it('should set the correct type when given');
      });
    });

    context('with semantically incorrect request data', () => {
      it('should return error when token is in header but not valid');
      it('should return error when token is in header but user is not activated');
      it('should return error when unaccessible fields are present w/ normal token user');
      it('should return error when unaccessible fields are present w/o token');
      it('should return error when trying to create duplicate user');
    });
  });

  describe('PATCH /', () => {
    context('with mal-formed request data', () => {
      it('should return error when body is empty');
      it('should return error when body is not an object');
      it('should return error when body contains unknown fields');
      it('should return error when body contains invalid email');
      it('should return error when body contains invalid password');
      it('should return error when body contains invalid username');
    });

    context('with valid request data', () => {
      it('should return 202 when no token is present');
      it('should return 202 when token user is normal');
      it('should return 201 when token user is admin');
    });

    context('with semantically incorrect request data', () => {
      it('should return error when token is in header but not valid');
      it('should return error when token is in header but user is not activated');
      it('should return error when unaccessible fields are present w/ normal token user');
      it('should return error when unaccessible fields are present w/o token');
      it('should return error when trying to change email to an existing email');
      it('should return error when trying to change username to an existing username');
    });
  });
});
