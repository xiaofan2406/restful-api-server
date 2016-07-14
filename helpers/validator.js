import { type as userType } from '../constants/user-constants';
// TODO use validator.js?

/* common validators */
export function isThere(target) {
  return target !== undefined && target !== null;
}

export function isNumber(target) {
  return target !== undefined && target !== null &&
    target !== '' && !/^\s+$/.test(target) &&
    typeof target !== 'boolean' &&
    !(Array.isArray(target)) &&
    !isNaN(target);
}

export function isBoolean(target) {
  return target === true || target === false;
}

export function isEmptyObject(target) {
  return target !== undefined && target !== null &&
    target.constructor === {}.constructor && Object.keys(target).length === 0;
}

function _objectHasEmptyValue(target) {
  for (const key of Object.keys(target)) {
    if (!isThere(target[key])) {
      return true;
    }
  }
  return false;
}

/* user model validators */
export function validPassword(password) {
  return typeof password === 'string' &&
    /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]{6,28})$/.test(password);
}

export function validUsername(username) {
  return isThere(username) && username.length > 5;
}

export function isEmail(email) {
  if (!isThere(email)) {
    return false;
  }
  // TODO improve this logic???? duh
  const index = email.indexOf('@');
  return index > 0 && index !== email.length;
}

export function validUserType(target) {
  const types = Object.keys(userType);
  for (const type of types) {
    if (userType[type] === target) {
      return true;
    }
  }
  return false;
}

export function isPassword(password) {
  return isThere(password);
}

const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isUUID(target) {
  return uuid.test(target);
}

// TODO rid of this
export function isJSON(target) {
  return !isEmptyObject(target) && !_objectHasEmptyValue(target);
}
