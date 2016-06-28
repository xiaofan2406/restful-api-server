const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail-config');
const { CLIENT_URL } = require('../config/app-config');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(mailConfig);

const mailer = mailOptions => {
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

function sendVerificationEmail(to, userHash) {
  const content = `
    <style>
      p {
        font-family: 'Source Sans Pro', 'Lucida Grande', sans-serif'
      }
    </style>
    <p>Please click the following link to activate your account.</p>
    <p>
      <a href="${CLIENT_URL}/activateAccount?email=${to}&hash=${userHash}">
        Click here to activate
      </a>
    </p>
  `;
  const mailOptions = {
    from: '"Admin" <admin@restful.com>',
    to,
    subject: 'Activate your account',
    html: content
  };
  return mailer(mailOptions);
}


/**
 * mailOptions:
 * from 'sender@server.com' or formatted '"Sender Name" <sender@server.com>'
 * to - Comma separated list or an array of recipients e-mail addresses
 * cc - Comma separated list or an array of recipients e-mail addresses
 * bcc - Comma separated list or an array of recipients e-mail addresses
 * subject - The subject of the e-mail
 * text - The plaintext version of the message
 * html - The HTML version of the message
 * attachments - An array of attachment objects
 * https://github.com/nodemailer/nodemailer for more details
 */
module.exports = {
  mailer,
  sendVerificationEmail
};
