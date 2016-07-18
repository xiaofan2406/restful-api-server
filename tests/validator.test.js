/* global describe, it, context, before, after */
/* eslint-disable no-unused-expressions */
import * as Validator from '../helpers/validator-funcs';
import { expect } from 'chai';

context('common validators', () => {
  describe('isThere', () => {
    const { isThere } = Validator;
    context('Array', () => {
      it('returns true with any array', () => {
        expect(isThere([])).to.be.true;
        expect(isThere([1, '2'])).to.be.true;
      });
    });

    context('String', () => {
      it('returns true with any string', () => {
        expect(isThere('')).to.be.true;
        expect(isThere('0')).to.be.true;
        expect(isThere('1')).to.be.true;
        expect(isThere(' ')).to.be.true;
        expect(isThere('some string')).to.be.true;
      });
    });

    context('Object', () => {
      it('returns true with any object', () => {
        expect(isThere({})).to.be.true;
        expect(isThere({ key: 'somevalue' })).to.be.true;
      });
    });

    context('Boolean', () => {
      it('returns true with any boolean', () => {
        expect(isThere(true)).to.be.true;
        expect(isThere(false)).to.be.true;
      });
    });

    context('Number', () => {
      it('returns true with any number', () => {
        expect(isThere(0)).to.be.true;
        expect(isThere(1)).to.be.true;
        expect(isThere(-1)).to.be.true;
        expect(isThere(2016)).to.be.true;
      });
    });

    context('Speical', () => {
      it('return false with special values', () => {
        expect(isThere()).to.be.false;
        expect(isThere(null)).to.be.false;
      });
    });
  });

  describe('isNumber', () => {
    const { isNumber } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isNumber([])).to.be.false;
        expect(isNumber([0])).to.be.false;
        expect(isNumber([0, 1])).to.be.false;
      });
    });

    context('String', () => {
      it('returns true with string contains only numbers', () => {
        expect(isNumber('0')).to.be.true;
        expect(isNumber('1')).to.be.true;
        expect(isNumber('+2016')).to.be.true;
        expect(isNumber('-2016')).to.be.true;
        expect(isNumber('.123')).to.be.true;
      });
      it('returns false with empty string', () => {
        expect(isNumber('')).to.be.false;
      });
      it('returns false with string contain non-digits', () => {
        expect(isNumber('string')).to.be.false;
        expect(isNumber('_123')).to.be.false;
        expect(isNumber(' ')).to.be.false;
        expect(isNumber('\n')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isNumber({})).to.be.false;
        expect(isNumber({ i: 0 })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isNumber(true)).to.be.false;
        expect(isNumber(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('return true with any numbers', () => {
        expect(isNumber(0)).to.be.true;
        expect(isNumber(1)).to.be.true;
        expect(isNumber(-1)).to.be.true;
        expect(isNumber(2016)).to.be.true;
      });
    });

    context('Speical', () => {
      it('return false with special values', () => {
        expect(isNumber()).to.be.false;
        expect(isNumber(null)).to.be.false;
      });
    });
  });

  describe('isBoolean', () => {
    const { isBoolean } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isBoolean([])).to.be.false;
        expect(isBoolean([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns false with any string', () => {
        expect(isBoolean('')).to.be.false;
        expect(isBoolean('0')).to.be.false;
        expect(isBoolean('1')).to.be.false;
        expect(isBoolean(' ')).to.be.false;
        expect(isBoolean('some string')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isBoolean({})).to.be.false;
        expect(isBoolean({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      expect(isBoolean(true)).to.be.true;
      expect(isBoolean(false)).to.be.true;
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isBoolean(0)).to.be.false;
        expect(isBoolean(1)).to.be.false;
        expect(isBoolean(-1)).to.be.false;
        expect(isBoolean(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('return false with special values', () => {
        expect(isBoolean()).to.be.false;
        expect(isBoolean(null)).to.be.false;
      });
    });
  });

  describe('isEmptyObject', () => {
    const { isEmptyObject } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isEmptyObject([])).to.be.false;
        expect(isEmptyObject([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns false with any string', () => {
        expect(isEmptyObject('')).to.be.false;
        expect(isEmptyObject('0')).to.be.false;
        expect(isEmptyObject('1')).to.be.false;
        expect(isEmptyObject(' ')).to.be.false;
        expect(isEmptyObject('some string')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns true with empty object', () => {
        expect(isEmptyObject({})).to.be.true;
      });

      it('returns false with non-empty object', () => {
        expect(isEmptyObject({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      expect(isEmptyObject(true)).to.be.false;
      expect(isEmptyObject(false)).to.be.false;
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isEmptyObject(0)).to.be.false;
        expect(isEmptyObject(1)).to.be.false;
        expect(isEmptyObject(-1)).to.be.false;
        expect(isEmptyObject(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('return false with special values', () => {
        expect(isEmptyObject()).to.be.false;
        expect(isEmptyObject(null)).to.be.false;
      });
    });
  });
});

context('user-model validators', () => {
  describe('validPassword', () => {
    const { validPassword } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(validPassword([])).to.be.false;
        expect(validPassword([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns true with at least a word character, a digit and length of [6, 28]', () => {
        expect(validPassword('p12345')).to.be.true;
        expect(validPassword('12345p')).to.be.true;
        expect(validPassword('p12345abcdefghijklmnopqrstuv')).to.be.true;
      });
      it('return false with no word character', () => {
        expect(validPassword('123456')).to.be.false;
        expect(validPassword('123456789')).to.be.false;
      });
      it('return false with no digit character', () => {
        expect(validPassword('abcdef')).to.be.false;
        expect(validPassword('abcdefghijklmnopqrstuvwxyznn')).to.be.false;
      });
      it('return false with length under 6', () => {
        expect(validPassword('p1234')).to.be.false;
      });
      it('return false with length over 28', () => {
        expect(validPassword('p12345abcdefghijklmnopqrstuvw')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(validPassword({})).to.be.false;
        expect(validPassword({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      expect(validPassword(true)).to.be.false;
      expect(validPassword(false)).to.be.false;
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(validPassword(0)).to.be.false;
        expect(validPassword(1)).to.be.false;
        expect(validPassword(-1)).to.be.false;
        expect(validPassword(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('return false with special values', () => {
        expect(validPassword()).to.be.false;
        expect(validPassword(null)).to.be.false;
      });
    });
  });

  describe('validUsername', () => {
    const { validUsername } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(validUsername([])).to.be.false;
        expect(validUsername([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns true with no special word, not all digits, ' +
        'not starting with special character, ' +
        'no whitespace, not all characters and length of [3, 28]');
      it('returns false with special word');
      it('returns false with special character starting');
      it('returns false with special character ending');
      it('returns false with not allowed special characters');
      it('returns false with all digits');
      it('returns false with all special characters');
      it('returns false with length over 28');
      it('returns false with length under 3');
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(validUsername({})).to.be.false;
        expect(validUsername({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(validUsername(true)).to.be.false;
        expect(validUsername(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(validUsername(0)).to.be.false;
        expect(validUsername(1)).to.be.false;
        expect(validUsername(-1)).to.be.false;
        expect(validUsername(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('return false with special values', () => {
        expect(validUsername()).to.be.false;
        expect(validUsername(null)).to.be.false;
      });
    });
  });

  describe('validUserType', () => {
    context('Array', () => {

    });

    context('String', () => {

    });

    context('Object', () => {

    });

    context('Boolean', () => {

    });

    context('Number', () => {

    });

    context('Speical', () => {

    });
  });
});

context('todo-model validators', () => {
  context('Array', () => {

  });

  context('String', () => {

  });

  context('Object', () => {

  });

  context('Boolean', () => {

  });

  context('Number', () => {

  });

  context('Speical', () => {

  });
});

context('article-model validators', () => {

});
