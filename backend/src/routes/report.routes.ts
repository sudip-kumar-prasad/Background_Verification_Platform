import { Router } from 'express';
import { downloadReport } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply auth middleware
router.get('/:id', authenticateToken, downloadReport);

export default router;
