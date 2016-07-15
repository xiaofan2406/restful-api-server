import { Router } from 'express';
import requireAuth from '../helpers/passport-jwt';

const router = Router();


router.get('/', requireAuth, (req, res) => {
  // todo send documentation
  res.status(200).json({ message: 'index page' });
});

export default router;
