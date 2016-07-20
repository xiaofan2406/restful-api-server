import {
  type as userType,
  resource as resourceType,
  reserved
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

export function isEmptyString(target) {
  return typeof target === 'string' && target.trim().length === 0;
}

const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isUUID(target) {
  return uuid.test(target);
}

export function isISODateString(target) {
  return typeof target === 'string' &&
    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/.test(target);
}

export function isMediumString(target) {
  const trimmed = target.trim();
  return typeof target === 'string' && trimmed.length > 0 && trimmed.length < 255;
}


/* user model validators */
export function isPassword(target) {
  return typeof target === 'string' &&
    /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]{6,28})$/.test(target);
}

export function isUsername(target) {
  if (typeof target !== 'string') {
    return false;
  }

  /* eslint-disable max-len */
  if (!/^([a-zA-Z]){1}((?=.*[a-zA-Z])[a-zA-Z0-9@_\.\-]{1,252})([a-zA-Z0-9]){1}$/.test(target)) {
    return false;
  }

  for (const word of reserved) {
    if (target.indexOf(word) > -1) {
      return false;
    }
  }

  return true;
}

export function isEmail(target) {
  if (typeof target !== 'string') {
    return false;
  }
  if (!isThere(target)) {
    return false;
  }
  /* eslint-disable max-len */
  if (!/^([a-zA-Z]){1}((?=.*[a-zA-Z])(?=.*[@])[a-zA-Z0-9@_\.\-]{1,252})([a-zA-Z]){1}$/.test(target)) {
    return false;
  }
  return true;
}

export function isUserType(target) {
  if (typeof target !== 'number') {
    return false;
  }
  const types = Object.keys(userType);
  for (const type of types) {
    if (userType[type] === target) {
      return true;
    }
  }
  return false;
}

export function isResourceType(target) {
  if (typeof target !== 'number') {
    return false;
  }
  const types = Object.keys(resourceType);
  for (const type of types) {
    if (resourceType[type] === target) {
      return true;
    }
  }
  return false;
}

export function isResources(target) {
  if (!Array.isArray(target)) {
    return false;
  }
  for (const each of target) {
    if (!isResourceType(each)) {
      return false;
    }
  }
  return true;
}


/* todo model validators */
export function isTodoTitle(target) {
  return typeof target === 'string' && target.trim().length < 255;
}

export function isTodoContent(target) {
  return typeof target === 'string' && target.trim().length < 255;
}

export function isTodoScope(target) {
  return typeof target === 'string' && target.trim().length < 255;
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
