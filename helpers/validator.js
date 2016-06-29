import util from 'util';

export function isThere(target) {
  return target !== undefined && target !== null && target !== '';
}

export function isNumber(target) {
  return !isNaN(+target);
}

export function isEmptyObject(target) {
  return !util.isObject(target) || Object.keys(target).length === 0;
}

function _objectHasEmptyValue(target) {
  for (const key of Object.keys(target)) {
    if (!isThere(target[key])) {
      return true;
    }
  }
  return false;
}

export function isEmail(email) {
  if (!isThere(email)) {
    return false;
  }
  // TODO improve this logic???? duh
  const index = email.indexOf('@');
  return index > 0 && index !== email.length;
}

export function isPassword(password) {
  return isThere(password);
}

const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isUUID(target) {
  return uuid.test(target);
}

export function isJSON(target) {
  return !isEmptyObject(target) && !_objectHasEmptyValue(target);
}
