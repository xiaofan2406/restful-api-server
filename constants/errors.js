const ERROR422 = new Error('Invalid request data');
ERROR422.status = 422;

const ERROR409 = new Error('Conflict request');
ERROR409.status = 409;

const ERROR401 = new Error('Unauthorized');
ERROR401.status = 401;

const ERROR500 = new Error('Internal server error');
ERROR500.status = 500;

const ERROR403 = new Error('Forbidden');
ERROR403.status = 403;

const ERROR412 = new Error('Precondition fail');
ERROR412.status = 412;

export default {
  ERROR422,
  ERROR409,
  ERROR401,
  ERROR500,
  ERROR403,
  ERROR412
};
