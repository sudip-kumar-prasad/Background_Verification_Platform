import { Router } from 'express';
import { startVerification } from '../controllers/verification.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Secure this route
router.post('/:id/start', authenticateToken, startVerification);

export default router;
