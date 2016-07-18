import {
  type as userType,
  resources as resType
} from '../constants/user-constants';
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

const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isUUID(target) {
  return uuid.test(target);
}

/* user model validators */
export function validPassword(target) {
  return typeof target === 'string' &&
    /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]{6,28})$/.test(target);
}

export function validUsername(target) {
  // TODO avoid username being 'activateAccount' or other key words
  return isThere(target) && target.length > 5;
}

export function isEmail(target) {
  if (!isThere(target)) {
    return false;
  }
  // TODO improve this logic???? duh
  const index = target.indexOf('@');
  return index > 0 && index !== target.length;
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

export function validResType(target) {
  const types = Object.keys(resType);
  for (const type of types) {
    if (resType[type] === target) {
      return true;
    }
  }
  return false;
}

export function validResources(target) {
  for (const each of target) {
    if (!validResType(each)) {
      return false;
    }
  }
  return true;
}

export function isPassword(target) {
  return isThere(target);
}

/* todo model validators */
export function validTodoTitle(target) {
  return typeof target === 'string' && target.length < 255;
}

export function validTodoContent(target) {
  return typeof target === 'string' && target.length < 255;
}

export function validDueDate(target) {
  return true;
}

export function validScope(target) {
  return target.length > 5;
}

export function validScopeDate(target) {
  return true;
}


// TODO rid of this
function _objectHasEmptyValue(target) {
  for (const key of Object.keys(target)) {
    if (!isThere(target[key])) {
      return true;
    }
  }
  return false;
}
export function isJSON(target) {
  return !isEmptyObject(target) && !_objectHasEmptyValue(target);
}
