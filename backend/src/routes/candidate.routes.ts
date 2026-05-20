import { Router } from 'express';
import {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} from '../controllers/candidate.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all candidate routes
router.use(authenticateToken);

router.post('/', createCandidate);
router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.put('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

export default router;
