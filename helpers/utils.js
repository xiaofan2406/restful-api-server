const isEmail = email => {
  const index = email.indexOf('@');
  return index > 0 && index !== email.length;
};

module.exports = {
  isEmail

};
