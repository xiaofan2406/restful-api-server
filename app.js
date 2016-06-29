import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import { HTTPLogger } from './helpers/logger';
import appRouter from './routes/app-router';
import apiRouter from './routes/api-router';

const app = express();
app.use(morgan('dev', { stream: HTTPLogger.stream })); // morgan http logger
app.use(cors()); // enable CORS request
app.use(bodyParser.json()); // parse JSON data
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
 /* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err
  });
});
 /* eslint-enable no-unused-vars */

export default app;
