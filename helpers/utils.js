
function isEmail(email) {
  // TODO improve this logic???? duh
  const index = email.indexOf('@');
  return index > 0 && index !== email.length;
}

function isThere(target) {
  return target !== undefined && target !== null && target !== '';
}

module.exports = {
  isEmail,
  isThere
};
