const {
  isThere,
  isUUID,
  isJSON
} = require('../helpers/validator');
const Error = require('../helpers/errors');

const InvalidRequestDataError = Error(422, 'Invalid request data');

function requireTitleInBody(req, res, next) {
  const { title } = req.body;
  if (!isThere(title)) {
    return next(InvalidRequestDataError);
  }
  next();
}

function requireJsonBody(req, res, next) {
  if (!isJSON(req.body)) {
    return next(InvalidRequestDataError);
  }
  next();
}

function requireUUIDParam(req, res, next) {
  if (!isUUID(req.params.id)) {
    return next(InvalidRequestDataError);
  }
  next();
}

module.exports = {
  requireTitleInBody,
  requireJsonBody,
  requireUUIDParam
};
