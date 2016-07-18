import * as Validator from '../helpers/validator';
import { InvalidRequestDataError } from '../helpers/errors';

export default validatorFuncs => (fromReq, required = []) => (req, res, next) => {
  const target = req[fromReq];
  if (Validator.isEmptyObject(target)) {
    console.log(fromReq, 'is not valid');
    return next(InvalidRequestDataError);
  }
  const validFields = Object.keys(validatorFuncs);
  const requestFields = Object.keys(target);
  for (const requiredField of required) {
    if (!target.hasOwnProperty(requiredField)) {
      console.log(fromReq, 'is not valid');
      return next(InvalidRequestDataError);
    }
  }
  for (const field of requestFields) {
    if (validFields.indexOf(field) === -1) {
      console.log(field, 'is not valid');
      return next(InvalidRequestDataError);
    }
    const func = validatorFuncs[field];
    if (!Validator[func](target[field])) {
      console.log(field, 'is not valid');
      return next(InvalidRequestDataError);
    }
  }
  next();
};
