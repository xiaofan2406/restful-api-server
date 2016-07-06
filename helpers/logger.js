import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

export const SQLLogger = new (winston.Logger)({
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

/**
 * custom mail logger to work with nodemailer
 */
export const MailLogger = new (winston.Logger)({
  transports: [
    new (DailyRotateFile)({
      filename: path.join(__dirname, '../logs/mail.log'),
      json: false,
      timestamp() {
        return new Date();
      },
      formatter(options) {
        if (options.level === 'error') {
          return `[${options.timestamp()}] ERROR: ${options.meta.message}`;
        }
        return `[${options.timestamp()}] INFO: ${JSON.stringify(options.meta, ' ', 2)}`;
      }
    })
  ]
});

export const HTTPLogger = new (winston.Logger)({
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
