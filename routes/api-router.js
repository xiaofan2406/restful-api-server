const express = require('express');
const router = express.Router();
const articleRouter = require('./article-router');
/**
 * this file should import all the api resource routes
 */

router.use('/article', articleRouter);

module.exports = router;
