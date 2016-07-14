import * as Validator from '../helpers/validator';
import { InvalidRequestDataError } from '../helpers/errors';

export default validatorFuncs => (fromReq, required = []) => (req, res, next) => {
  const validFields = Object.keys(validatorFuncs);
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
    const func = validatorFuncs[field];
    if (!Validator[func](target[field])) {
      return next(InvalidRequestDataError);
    }
  }
  next();
};
