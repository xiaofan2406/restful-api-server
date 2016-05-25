const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail-config');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(mailConfig);

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
module.exports = (mailOptions) => {
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
