const express = require('express');
const router = express.Router();
const articleRouter = require('./article-router');
const todoRouter = require('./todo-router');
/**
 * this file should import all the api resource routes
 */

router.use('/article', articleRouter);
router.use('/todo', todoRouter);

module.exports = router;
