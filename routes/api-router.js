import { Router } from 'express';
import userRouter from './user-router';
import articleRouter from './article-router';
import todoRouter from './todo-router';
const router = Router();

/**
 * this file should import all the api resource routes
 */
router.use('/user', userRouter);
router.use('/article', articleRouter);
router.use('/todo', todoRouter);

export default router;
