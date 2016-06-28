const validators = require('./validator');
const Error = require('../helpers/errors');

const unprocessableEntityError = Error(422, 'Invalid request data');

const valid = (fieldsValidator, target) => (req, res, next) => {
  if (typeof fieldsValidator === 'function') {
    if (!validators[fieldsValidator](req[target])) {
      return next(unprocessableEntityError);
    }
  } else if (Array.isArray(fieldsValidator)) {
    for (const func of fieldsValidator) {
      if (!validators[func](req[target])) {
        return next(unprocessableEntityError);
      }
    }
  } else if (typeof fieldsValidator === 'object') {
    const fields = Object.keys(fieldsValidator);
    for (const field of fields) {
      const func = fieldsValidator[field].func;
      const fieldTarget = fieldsValidator[field].target;
      if (!fieldTarget) {
        if (!validators[func](req[field])) {
          return next(unprocessableEntityError);
        }
      } else {
        if (!validators[func](req[fieldTarget][field])) {
          return next(unprocessableEntityError);
        }
      }
    }
  }
  next();
};

module.exports = valid;
