const winston = require('winston');
const path = require('path');

const SQLLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      filename: path.join(__dirname, '../logs/sql.log'),
      json: false,
      timestamp() {
        return new Date();
      },
      formatter(options) {
        return `[${options.timestamp()}] ${options.message}`;
      }
    })
  ]
});

// TODO create new application logger here and export it

module.exports = {
  SQLLogger
};
