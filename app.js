const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const HTTPLogger = require('./helpers/logger').HTTPLogger;

const appRouter = require('./routes/app-router');
const apiRouter = require('./routes/api-router');

const app = express();
app.use(morgan('dev', { stream: HTTPLogger.stream })); // morgan http logger
app.use(cors()); // enable CORS request
app.use(bodyParser.json({ type: '*/*' })); // parse JSON data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', appRouter);
app.use('/api', apiRouter);

/**
 * Put all express routing before this.
 * so that when a route reaches here, it is a 404
 * catch 404 and forward to error handler
 */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});


/**
 * Error handlers, these must be defined at last, after app.use() and routes call
 * error handler functions always take four arguments (err, req, res, next)
 */
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
    next();
  });
}
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err
  });
  next();
});


module.exports = app;
