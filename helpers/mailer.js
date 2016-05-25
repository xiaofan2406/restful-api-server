const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail-config');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(mailConfig);


module.exports =
(to, subject, content, fromAddress = '"Admin RestAPI Server" <admin@restfulapi.com>') => {
  // setup e-mail data with unicode symbols
  const mailOptions = {
    from: fromAddress, // sender address
    to,
    subject,
    html: content
  };

  return new Promise((resolve, reject) => {
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      }
      resolve(info);
    });
  });
};
