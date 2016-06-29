import validators from './validator';
import { InvalidRequestDataError } from '../helpers/errors';

const valid = (fieldsValidator, target) => (req, res, next) => {
  if (typeof fieldsValidator === 'function') {
    if (!validators[fieldsValidator](req[target])) {
      return next(InvalidRequestDataError);
    }
  } else if (Array.isArray(fieldsValidator)) {
    for (const func of fieldsValidator) {
      if (!validators[func](req[target])) {
        return next(InvalidRequestDataError);
      }
    }
  } else if (typeof fieldsValidator === 'object') {
    const fields = Object.keys(fieldsValidator);
    for (const field of fields) {
      const func = fieldsValidator[field].func;
      const fieldTarget = fieldsValidator[field].target;
      if (!fieldTarget) {
        if (!validators[func](req[field])) {
          return next(InvalidRequestDataError);
        }
      } else {
        if (!validators[func](req[fieldTarget][field])) {
          return next(InvalidRequestDataError);
        }
      }
    }
  }
  next();
};

export default valid;
