import {
  isThere,
  isUUID,
  isJSON
} from '../helpers/validator';
import { InvalidRequestDataError } from '../helpers/errors';

export function requireTitleInBody(req, res, next) {
  const { title } = req.body;
  if (!isThere(title)) {
    return next(InvalidRequestDataError);
  }
  next();
}

export function requireJsonBody(req, res, next) {
  if (!isJSON(req.body)) {
    return next(InvalidRequestDataError);
  }
  next();
}

export function requireUUIDParam(req, res, next) {
  if (!isUUID(req.params.id)) {
    return next(InvalidRequestDataError);
  }
  next();
}
