import * as funcs from '../helpers/validator-funcs';
import { InvalidRequestDataError } from '../helpers/errors';

/**
 * 1. initialize an instance with a model (providing fieldsValidator()), e.g.
 *      import Validator from '../helpers/validator-mdw';
 *      const userFieldsValidator = Validator(User.fieldsValidator());
 *
 * >  fieldsValidator() provide a object describing the functions to run
 *    in order to validate each field, e.g
 *      return {
 *        title: 'validTodoTitle',
 *        content: 'validTodoContent',
 *      }
 * >  each of these functions are provided by validator-funcs.js
 *
 * 2. call it with a specs parameter, a object describe the req object,
 *    with key being the property of req object, and
 *    value being the required fields from the property, e.g.
 *      userFieldsValidator({ body: [] })
 *
 * 3. above call validates all the fields in body with no required fields,
 *    against functions provided by the fieldsValidator() and validator-funcs.js,
 *    and returns an express middleware
 */
export default validatorFuncs => specs => (req, res, next) => {
  const fromReqs = Object.keys(specs);
  for (const fromReq of fromReqs) {
    const required = specs[fromReq];

    const target = req[fromReq];
    if (funcs.isEmptyObject(target)) {
      return next(InvalidRequestDataError);
    }
    const validFields = Object.keys(validatorFuncs);
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
      if (!funcs[func](target[field])) {
        return next(InvalidRequestDataError);
      }
    }
  }
  next();
};
