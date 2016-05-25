const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

const SQLLogger = new (winston.Logger)({
  transports: [
    new (DailyRotateFile)({
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


const HTTPLogger = new (winston.Logger)({
  transports: [
    new (DailyRotateFile)({
      filename: path.join(__dirname, '../logs/http.log'),
      json: false,
      timestamp() {
        return new Date();
      },
      formatter(options) {
        return `[${options.timestamp()}] ${options.message}`;
      }
    }),
    new (winston.transports.Console)({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true
    })
  ],
  exitOnError: false
});

HTTPLogger.stream = {
  write(message) {
    HTTPLogger.info(message);
  }
};


// TODO create new application logger here and export it

module.exports = {
  SQLLogger,
  HTTPLogger
};
