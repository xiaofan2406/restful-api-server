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

function objectHasEmptyValue(target) {
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


module.exports = {
  isEmail,
  isPassword,
  isThere,
  isNumber,
  isEmptyObject,
  objectHasEmptyValue
};
