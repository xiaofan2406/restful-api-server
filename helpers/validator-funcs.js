import {
  type as userType,
  resources as resourceType
} from '../constants/user-constants';

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


/* user modle validators */
export function isPassword(target) {
  return typeof target === 'string' &&
    /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]{6,28})$/.test(target);
}

export function isUsername(target) {
  if (typeof target !== 'string') {
    return false;
  }
  /* eslint-disable max-len */
  if (!/^([a-zA-Z])+((?=.*[a-zA-Z])([a-zA-Z0-9_.-@])){1,26}([a-zA-Z0-9])+$/.test(target)) {
    return false;
  }
  // TODO avoid username being 'activateAccount' or other key words
  return true;
}

export function isEmail(target) {
  if (!isThere(target)) {
    return false;
  }
  // TODO improve this logic???? duh
  const index = target.indexOf('@');
  return index > 0 && index !== target.length;
}

export function isUserType(target) {
  const types = Object.keys(userType);
  for (const type of types) {
    if (userType[type] === target) {
      return true;
    }
  }
  return false;
}

export function isResourceType(target) {
  const types = Object.keys(resourceType);
  for (const type of types) {
    if (resourceType[type] === target) {
      return true;
    }
  }
  return false;
}

export function isResources(target) {
  for (const each of target) {
    if (!isResourceType(each)) {
      return false;
    }
  }
  return true;
}


/* todo modle validators */
export function isTodoTitle(target) {
  return typeof target === 'string' && target.length < 255;
}

export function isTodoContent(target) {
  return typeof target === 'string' && target.length < 255;
}

export function isDueDate(target) {
  return new Date(target) instanceof Date;
}

export function isTodoScope(target) {
  return typeof target === 'string' && target.length < 255;
}

export function isTodoScopeDate(target) {
  return new Date(target) instanceof Date;
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
