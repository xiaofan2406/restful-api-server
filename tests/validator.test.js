/* global describe, it, context, before, after */
import * as Validator from '../helpers/validator';

context('common validators', () => {
  describe('isThere', () => {
    it('should return false when target is undefined');
    it('should return false when target is null');
    it('should return false when target is an emtpy string');
    it('should return true when target is 0');
    it('should return true when target is normal string');
    it('should return true when target is an object');
    it('should return true when target is an empty object');
  });
});

context('user-model validators', () => {

});

context('todo-model validators', () => {

});

context('todo-model validators', () => {

});
