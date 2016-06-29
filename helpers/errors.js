const commonErrors = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  409: 'Conflict request',
  412: 'Precondition fail',
  422: 'Invalid request data',
  500: 'Internal server error'
};

const newError = (status, msg) => {
  const err = new Error(`${commonErrors[status.toString()]}: ${msg}`);
  err.status = status;
  return err;
};

export const InvalidRequestDataError = newError(422, 'Invalid request data');

export default newError;
