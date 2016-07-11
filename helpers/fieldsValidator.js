import Models from '../models';
import * as Validator from '../helpers/validator';

export default (target, model) => {
  const validators = Models[model].fieldsValidator();
  const validFields = Object.keys(validators);
  const requestFields = Object.keys(target);
  for (const field of requestFields) {
    if (validFields.indexOf(field) === -1) {
      return false;
    }
    const func = validators[field];
    if (!Validator[func](field)) {
      return false;
    }
  }
};
