/* global describe, it, context, before, after */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import * as Validator from '../helpers/validator-funcs';
import {
  type as userType,
  resource as resourceType
} from '../constants/user-constants';

context('common isators', () => {
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
      it('returns false with special values', () => {
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
      it('returns true with any numbers', () => {
        expect(isNumber(0)).to.be.true;
        expect(isNumber(1)).to.be.true;
        expect(isNumber(-1)).to.be.true;
        expect(isNumber(2016)).to.be.true;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
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
      it('returns true with any boolean', () => {
        expect(isBoolean(true)).to.be.true;
        expect(isBoolean(false)).to.be.true;
      });
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
      it('returns false with special values', () => {
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
      it('returns false with any boolean', () => {
        expect(isEmptyObject(true)).to.be.false;
        expect(isEmptyObject(false)).to.be.false;
      });
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
      it('returns false with special values', () => {
        expect(isEmptyObject()).to.be.false;
        expect(isEmptyObject(null)).to.be.false;
      });
    });
  });

  describe('isISODateString', () => {
    const { isISODateString } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isISODateString([])).to.be.false;
        expect(isISODateString([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns true with iso date string', () => {
        expect(isISODateString(new Date().toISOString())).to.be.true;
      });

      it('returns false with non-iso date string', () => {
        expect(isISODateString('')).to.be.false;
        expect(isISODateString('0')).to.be.false;
        expect(isISODateString('1')).to.be.false;
        expect(isISODateString(' ')).to.be.false;
        expect(isISODateString('some string')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isISODateString({})).to.be.false;
        expect(isISODateString({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isISODateString(true)).to.be.false;
        expect(isISODateString(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isISODateString(0)).to.be.false;
        expect(isISODateString(1)).to.be.false;
        expect(isISODateString(-1)).to.be.false;
        expect(isISODateString(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isISODateString()).to.be.false;
        expect(isISODateString(null)).to.be.false;
      });
    });
  });
});

context('user-model validators', () => {
  describe('isPassword', () => {
    const { isPassword } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isPassword([])).to.be.false;
        expect(isPassword([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns true with at least a word character, a digit and length of [6, 28]', () => {
        expect(isPassword('p12345')).to.be.true;
        expect(isPassword('12345p')).to.be.true;
        expect(isPassword('p12345abcdefghijklmnopqrstuv')).to.be.true;
      });
      it('returns false with no word character', () => {
        expect(isPassword('123456')).to.be.false;
        expect(isPassword('123456789')).to.be.false;
      });
      it('returns false with no digit character', () => {
        expect(isPassword('abcdef')).to.be.false;
        expect(isPassword('abcdefghijklmnopqrstuvwxyznn')).to.be.false;
      });
      it('returns false with length under 6', () => {
        expect(isPassword('p1234')).to.be.false;
      });
      it('returns false with length over 28', () => {
        expect(isPassword('p12345abcdefghijklmnopqrstuvw')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isPassword({})).to.be.false;
        expect(isPassword({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isPassword(true)).to.be.false;
        expect(isPassword(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isPassword(0)).to.be.false;
        expect(isPassword(1)).to.be.false;
        expect(isPassword(-1)).to.be.false;
        expect(isPassword(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isPassword()).to.be.false;
        expect(isPassword(null)).to.be.false;
      });
    });
  });

  describe('isEmail', () => {
    const { isEmail } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isEmail([])).to.be.false;
        expect(isEmail([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns true with string contains @ in the middle', () => {
        expect(isEmail('what@that')).to.be.true;
        expect(isEmail('what@that.com')).to.be.true;
        expect(isEmail('what-is@that')).to.be.true;
        expect(isEmail('what.this@that')).to.be.true;
        expect(isEmail('what_okay@that.com')).to.be.true;
      });

      it('returns false with non-word character staring', () => {
        expect(isEmail('@mail.com')).to.be.false;
        expect(isEmail('-mail.com')).to.be.false;
        expect(isEmail('_mail.com')).to.be.false;
        expect(isEmail('.mail.com')).to.be.false;
        expect(isEmail('1mail.com')).to.be.false;
      });

      it('returns false with non-word character ending', () => {
        expect(isEmail('mail.com@')).to.be.false;
        expect(isEmail('mail.com-')).to.be.false;
        expect(isEmail('mail.com.')).to.be.false;
        expect(isEmail('mail.com_')).to.be.false;
        expect(isEmail('mail.com1')).to.be.false;
      });

      it('returns false with not allowed characters', () => {
        expect(isEmail('mail!@email.com')).to.be.false;
        expect(isEmail('ma il!@email.com')).to.be.false;
      });

      it('returns false with length under 3', () => {
        expect(isEmail('j@')).to.be.false;
        expect(isEmail('@j')).to.be.false;
      });

      it('returns false with lenght over 254', () => {
        const str = 'abc@e'.repeat(51);
        expect(isEmail(str)).to.be.false;
      });

      it('returns false with string has no @', () => {
        expect(isEmail('')).to.be.false;
        expect(isEmail('0')).to.be.false;
        expect(isEmail('1')).to.be.false;
        expect(isEmail(' ')).to.be.false;
        expect(isEmail('somestring')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isEmail({})).to.be.false;
        expect(isEmail({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isEmail(true)).to.be.false;
        expect(isEmail(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isEmail(0)).to.be.false;
        expect(isEmail(1)).to.be.false;
        expect(isEmail(-1)).to.be.false;
        expect(isEmail(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isEmail()).to.be.false;
        expect(isEmail(null)).to.be.false;
      });
    });
  });

  describe('isUsername', () => {
    const { isUsername } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isUsername([])).to.be.false;
        expect(isUsername([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns true with no special word, not all digits, ' +
        'not starting with special character, ' +
        'at least two word characters with one starting' +
        'no whitespace, not all characters and length of [3, 254]', () => {
        expect(isUsername('jon')).to.be.true;
        expect(isUsername('jon-_@.onjonjonjonjonjonjon1')).to.be.true;
        expect(isUsername('J1on')).to.be.true;
        expect(isUsername('j-i1o')).to.be.true;
        expect(isUsername('ji@-_.1')).to.be.true;
      });
      it('returns false with special word', () => {
        expect(isUsername('admin')).to.be.false;
        expect(isUsername('root')).to.be.false;
        expect(isUsername('activateaccount')).to.be.false;
        expect(isUsername('resetpassword')).to.be.false;
      });
      it('returns false with non-word character starting', () => {
        expect(isUsername('_jon')).to.be.false;
        expect(isUsername('@jon')).to.be.false;
        expect(isUsername('-jon')).to.be.false;
        expect(isUsername('.jon')).to.be.false;
        expect(isUsername('2jon')).to.be.false;
      });
      it('returns false with special character ending', () => {
        expect(isUsername('jon@')).to.be.false;
        expect(isUsername('jon_')).to.be.false;
        expect(isUsername('jon.')).to.be.false;
        expect(isUsername('jon-')).to.be.false;
      });
      it('returns false with not allowed special characters', () => {
        expect(isUsername('jo!n')).to.be.false;
        expect(isUsername('jo#n')).to.be.false;
        expect(isUsername('jo$n')).to.be.false;
        expect(isUsername('jo%n')).to.be.false;
        expect(isUsername('jo^n')).to.be.false;
        expect(isUsername('jo&n')).to.be.false;
        expect(isUsername('jo*n')).to.be.false;
        expect(isUsername('jo(n')).to.be.false;
        expect(isUsername('jo)n')).to.be.false;
        expect(isUsername('jo=n')).to.be.false;
        expect(isUsername('jo+n')).to.be.false;
        expect(isUsername('jo~n')).to.be.false;
        expect(isUsername('jo{n')).to.be.false;
        expect(isUsername('jo}n')).to.be.false;
        expect(isUsername('jo,n')).to.be.false;
        expect(isUsername('jo/n')).to.be.false;
        expect(isUsername('jo n')).to.be.false;
        expect(isUsername('jo\'n')).to.be.false;
        expect(isUsername('jo"n')).to.be.false;
        expect(isUsername('jo;n')).to.be.false;
        expect(isUsername('jo:n')).to.be.false;
        expect(isUsername('jo[n')).to.be.false;
        expect(isUsername('jo]n')).to.be.false;
        expect(isUsername('jo\\m')).to.be.false;
        expect(isUsername('jo|n')).to.be.false;
      });
      it('returns false with only one word character', () => {
        expect(isUsername('j@-_.1')).to.be.false;
      });
      it('returns false with all digits', () => {
        expect(isUsername('1234')).to.be.false;
      });
      it('returns false with all special characters', () => {
        expect(isUsername('.-_@')).to.be.false;
      });
      it('returns false with length over 254', () => {
        const str = 'abcde'.repeat(51);
        expect(isUsername(str)).to.be.false;
      });
      it('returns false with length under 3', () => {
        expect(isUsername('ji')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isUsername({})).to.be.false;
        expect(isUsername({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isUsername(true)).to.be.false;
        expect(isUsername(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isUsername(0)).to.be.false;
        expect(isUsername(1)).to.be.false;
        expect(isUsername(-1)).to.be.false;
        expect(isUsername(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isUsername()).to.be.false;
        expect(isUsername(null)).to.be.false;
      });
    });
  });

  describe('isUserType', () => {
    const { isUserType } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isUserType([])).to.be.false;
        expect(isUserType([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns false with any string', () => {
        expect(isUserType('')).to.be.false;
        expect(isUserType('0')).to.be.false;
        expect(isUserType('1')).to.be.false;
        expect(isUserType(' ')).to.be.false;
        expect(isUserType('some string')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isUserType({})).to.be.false;
        expect(isUserType({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isUserType(true)).to.be.false;
        expect(isUserType(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns true with correct usertype number', () => {
        expect(isUserType(userType.NORMAL)).to.be.true;
        expect(isUserType(userType.ADMIN)).to.be.true;
        expect(isUserType(userType.EDITOR)).to.be.true;
      });
      it('returns false with any other number', () => {
        expect(isUserType(-1)).to.be.false;
        expect(isUserType(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isUserType()).to.be.false;
        expect(isUserType(null)).to.be.false;
      });
    });
  });

  describe('isResourceType', () => {
    const { isResourceType } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isResourceType([])).to.be.false;
        expect(isResourceType([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns false with any string', () => {
        expect(isResourceType('')).to.be.false;
        expect(isResourceType('0')).to.be.false;
        expect(isResourceType('1')).to.be.false;
        expect(isResourceType(' ')).to.be.false;
        expect(isResourceType('some string')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isResourceType({})).to.be.false;
        expect(isResourceType({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isResourceType(true)).to.be.false;
        expect(isResourceType(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns true with correct usertype number', () => {
        expect(isResourceType(resourceType.ARTICLE)).to.be.true;
        expect(isResourceType(resourceType.TODO)).to.be.true;
      });
      it('returns false with any other number', () => {
        expect(isResourceType(-1)).to.be.false;
        expect(isResourceType(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isResourceType()).to.be.false;
        expect(isResourceType(null)).to.be.false;
      });
    });
  });

  describe('isResources', () => {
    const { isResources } = Validator;
    context('Array', () => {
      it('returns true when array is empty', () => {
        expect(isResources([])).to.be.true;
      });
      it('returns true when array contains only correct resourceType', () => {
        expect(isResources([resourceType.TODO, resourceType.ARTICLE])).to.be.true;
        expect(isResources([resourceType.ARTICLE])).to.be.true;
      });
      it('returns false when array contains element that is not resourceType', () => {
        expect(isResources([resourceType.TODO, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns false with any string', () => {
        expect(isResources('')).to.be.false;
        expect(isResources('0')).to.be.false;
        expect(isResources('1')).to.be.false;
        expect(isResources(' ')).to.be.false;
        expect(isResources('some string')).to.be.false;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isResources({})).to.be.false;
        expect(isResources({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isResources(true)).to.be.false;
        expect(isResources(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isResources(0)).to.be.false;
        expect(isResources(1)).to.be.false;
        expect(isResources(-1)).to.be.false;
        expect(isResources(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isResources()).to.be.false;
        expect(isResources(null)).to.be.false;
      });
    });
  });
});

context('todo-model validators', () => {
  describe('isTodoTitle', () => {
    const { isTodoTitle } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isTodoTitle([])).to.be.false;
        expect(isTodoTitle([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns false with only whitespace', () => {
        expect(isTodoTitle(' ')).to.be.false;
        expect(isTodoTitle('       ')).to.be.false;
        expect(isTodoTitle('  \n ')).to.be.false;
      });

      it('returns false with length under 1', () => {
        expect(isTodoTitle('')).to.be.false;
      });

      it('returns falsw with length over 254', () => {
        const str = 'abcde'.repeat(51);
        expect(isTodoTitle(str)).to.be.false;
      });

      it('returns true with non-empty string with range [1, 254]', () => {
        expect(isTodoTitle('0')).to.be.true;
        expect(isTodoTitle('1')).to.be.true;
        expect(isTodoTitle('some string')).to.be.true;
        const str = 'ab'.repeat(127);
        expect(isTodoTitle(str)).to.be.true;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isTodoTitle({})).to.be.false;
        expect(isTodoTitle({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isTodoTitle(true)).to.be.false;
        expect(isTodoTitle(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isTodoTitle(0)).to.be.false;
        expect(isTodoTitle(1)).to.be.false;
        expect(isTodoTitle(-1)).to.be.false;
        expect(isTodoTitle(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isTodoTitle()).to.be.false;
        expect(isTodoTitle(null)).to.be.false;
      });
    });
  });

  describe('isTodoContent', () => {
    const { isTodoContent } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isTodoContent([])).to.be.false;
        expect(isTodoContent([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns false with only whitespace', () => {
        expect(isTodoContent(' ')).to.be.false;
        expect(isTodoContent('       ')).to.be.false;
        expect(isTodoContent('  \n ')).to.be.false;
      });

      it('returns false with length under 1', () => {
        expect(isTodoContent('')).to.be.false;
      });

      it('returns falsw with length over 254', () => {
        const str = 'abcde'.repeat(51);
        expect(isTodoContent(str)).to.be.false;
      });

      it('returns true with non-empty string with range [1, 254]', () => {
        expect(isTodoContent('0')).to.be.true;
        expect(isTodoContent('1')).to.be.true;
        expect(isTodoContent('some string')).to.be.true;
        const str = 'ab'.repeat(127);
        expect(isTodoContent(str)).to.be.true;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isTodoContent({})).to.be.false;
        expect(isTodoContent({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isTodoContent(true)).to.be.false;
        expect(isTodoContent(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isTodoContent(0)).to.be.false;
        expect(isTodoContent(1)).to.be.false;
        expect(isTodoContent(-1)).to.be.false;
        expect(isTodoContent(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isTodoContent()).to.be.false;
        expect(isTodoContent(null)).to.be.false;
      });
    });
  });

  describe('isTodoScope', () => {
    const { isTodoScope } = Validator;
    context('Array', () => {
      it('returns false with any array', () => {
        expect(isTodoScope([])).to.be.false;
        expect(isTodoScope([1, '2'])).to.be.false;
      });
    });

    context('String', () => {
      it('returns false with only whitespace', () => {
        expect(isTodoScope(' ')).to.be.false;
        expect(isTodoScope('       ')).to.be.false;
        expect(isTodoScope('  \n ')).to.be.false;
      });

      it('returns false with length under 1', () => {
        expect(isTodoScope('')).to.be.false;
      });

      it('returns falsw with length over 254', () => {
        const str = 'abcde'.repeat(51);
        expect(isTodoScope(str)).to.be.false;
      });

      it('returns true with non-empty string with range [1, 254]', () => {
        expect(isTodoScope('0')).to.be.true;
        expect(isTodoScope('1')).to.be.true;
        expect(isTodoScope('some string')).to.be.true;
        const str = 'ab'.repeat(127);
        expect(isTodoScope(str)).to.be.true;
      });
    });

    context('Object', () => {
      it('returns false with any object', () => {
        expect(isTodoScope({})).to.be.false;
        expect(isTodoScope({ key: 'somevalue' })).to.be.false;
      });
    });

    context('Boolean', () => {
      it('returns false with any boolean', () => {
        expect(isTodoScope(true)).to.be.false;
        expect(isTodoScope(false)).to.be.false;
      });
    });

    context('Number', () => {
      it('returns false with any number', () => {
        expect(isTodoScope(0)).to.be.false;
        expect(isTodoScope(1)).to.be.false;
        expect(isTodoScope(-1)).to.be.false;
        expect(isTodoScope(2016)).to.be.false;
      });
    });

    context('Speical', () => {
      it('returns false with special values', () => {
        expect(isTodoScope()).to.be.false;
        expect(isTodoScope(null)).to.be.false;
      });
    });
  });
});

context('article-model validators', () => {

});

// skelonton
// describe('isUserType', () => {
//   const { isUserType } = Validator;
//   context('Array', () => {
//     it('returns false with any array', () => {
//       expect(isUserType([])).to.be.false;
//       expect(isUserType([1, '2'])).to.be.false;
//     });
//   });
//
//   context('String', () => {
//     it('returns false with any string', () => {
//       expect(isUserType('')).to.be.false;
//       expect(isUserType('0')).to.be.false;
//       expect(isUserType('1')).to.be.false;
//       expect(isUserType(' ')).to.be.false;
//       expect(isUserType('some string')).to.be.false;
//     });
//   });
//
//   context('Object', () => {
//     it('returns false with any object', () => {
//       expect(isUserType({})).to.be.false;
//       expect(isUserType({ key: 'somevalue' })).to.be.false;
//     });
//   });
//
//   context('Boolean', () => {
//     it('returns false with any boolean', () => {
//       expect(isUserType(true)).to.be.false;
//       expect(isUserType(false)).to.be.false;
//     });
//   });
//
//   context('Number', () => {
//     it('returns false with any number', () => {
//       expect(isUserType(0)).to.be.false;
//       expect(isUserType(1)).to.be.false;
//       expect(isUserType(-1)).to.be.false;
//       expect(isUserType(2016)).to.be.false;
//     });
//   });
//
//   context('Speical', () => {
//     it('returns false with special values', () => {
//       expect(isUserType()).to.be.false;
//       expect(isUserType(null)).to.be.false;
//     });
//   });
// });
