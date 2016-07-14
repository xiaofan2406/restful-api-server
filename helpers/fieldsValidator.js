import * as Validator from '../helpers/validator';
import { InvalidRequestDataError } from '../helpers/errors';

export default (fromReq, model, required = []) => (req, res, next) => {
  const validators = model.fieldsValidator();
  const validFields = Object.keys(validators);
  const target = req[fromReq];
  const requestFields = Object.keys(target);
  for (const requiredField of required) {
    if (!target.hasOwnProperty(requiredField)) {
      return next(InvalidRequestDataError);
    }
  }
  for (const field of requestFields) {
    if (validFields.indexOf(field) === -1) {
      return next(InvalidRequestDataError);
    }
    const func = validators[field];
    if (!Validator[func](target[field])) {
      return next(InvalidRequestDataError);
    }
  }
  next();
};
