const util = require('util');

function isThere(target) {
  return target !== undefined && target !== null && target !== '';
}

function isNumber(target) {
  return !isNaN(+target);
}

function isEmptyObject(target) {
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

function isEmail(email) {
  if (!isThere(email)) {
    return false;
  }
  // TODO improve this logic???? duh
  const index = email.indexOf('@');
  return index > 0 && index !== email.length;
}

function isPassword(password) {
  return isThere(password);
}

const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

function isUUID(target) {
  return uuid.test(target);
}

function isJSON(target) {
  return !isEmptyObject(target) && !_objectHasEmptyValue(target);
}

module.exports = {
  isEmail,
  isPassword,
  isThere,
  isNumber,
  isEmptyObject,
  isUUID,
  isJSON
};
