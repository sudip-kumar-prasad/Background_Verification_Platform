import { Router } from 'express';
import { mockAadhaarVerify, mockPanVerify } from '../controllers/verification.controller';

const router = Router();

router.post('/aadhaar/verify', mockAadhaarVerify);
router.post('/pan/verify', mockPanVerify);

export default router;
