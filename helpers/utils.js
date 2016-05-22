
function isThere(target) {
  return target !== undefined && target !== null && target !== '';
}

function isEmail(email) {
  if (!isThere(email)) {
    return false;
  }
  // TODO improve this logic???? duh
  const index = email.indexOf('@');
  return index > 0 && index !== email.length;
}


module.exports = {
  isEmail,
  isThere
};
