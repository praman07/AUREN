import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.get('/me', requireAuth, (req: Request, res: Response) => {
  // If requireAuth succeeds, req.user is guaranteed to exist and be populated from the DB.
  res.status(200).json({ success: true, data: req.user });
});

export default router;
