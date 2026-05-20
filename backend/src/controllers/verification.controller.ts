import { Request, Response } from 'express';
import prisma from '../config/db';
import { verifyAadhaar, verifyPAN } from '../services/verification.service';
import { AuthenticatedRequest } from '../middleware/auth';

const aadhaarRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// --- MOCK THIRD-PARTY VERIFICATION ENDPOINTS ---

export const mockAadhaarVerify = async (req: Request, res: Response) => {
  try {
    const { aadhaarNumber } = req.body;

    if (!aadhaarNumber || !aadhaarRegex.test(aadhaarNumber)) {
      return res.status(400).json({
        status: 'failed',
        nameMatch: false,
        dobMatch: false,
        message: 'Invalid Aadhaar format. Must be 12 numeric digits.',
      });
    }

    // Simulate different mock responses based on input
    // If aadhaar ends with 0000, we mock a verification failure
    if (aadhaarNumber.endsWith('0000')) {
      return res.status(200).json({
        status: 'failed',
        nameMatch: false,
        dobMatch: false,
        message: 'Aadhaar details mismatch on name or DOB.',
      });
    }

    return res.status(200).json({
      status: 'verified',
      nameMatch: true,
      dobMatch: true,
      message: 'Aadhaar verified successfully',
    });
  } catch (error) {
    console.error('Mock Aadhaar API error:', error);
    res.status(500).json({ error: 'Mock Aadhaar verification failed' });
  }
};

export const mockPanVerify = async (req: Request, res: Response) => {
  try {
    const { panNumber } = req.body;

    if (!panNumber || !panRegex.test(panNumber)) {
      return res.status(400).json({
        status: 'failed',
        panStatus: 'inactive',
        message: 'Invalid PAN format. Expected format: ABCDE1234F',
      });
    }

    // Simulate different mock responses based on input
    // If PAN ends with 'Z', we mock verification failure (inactive/invalid)
    if (panNumber.endsWith('Z')) {
      return res.status(200).json({
        status: 'failed',
        panStatus: 'inactive',
        message: 'PAN is invalid or inactive.',
      });
    }

    return res.status(200).json({
      status: 'verified',
      panStatus: 'active',
      message: 'PAN verified successfully',
    });
  } catch (error) {
    console.error('Mock PAN API error:', error);
    res.status(500).json({ error: 'Mock PAN verification failed' });
  }
};

// --- CORE VERIFICATION WORKFLOW ENDPOINT ---

export const startVerification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: candidateId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch candidate
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        createdById: userId,
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Call Aadhaar verification
    const aadhaarRequestPayload = { aadhaarNumber: candidate.aadhaarNumber };
    const aadhaarResult = await verifyAadhaar(candidate.aadhaarNumber);

    // Call PAN verification
    const panRequestPayload = { panNumber: candidate.panNumber };
    const panResult = await verifyPAN(candidate.panNumber);

    // Determine status
    let overallStatus = 'FAILED';
    if (aadhaarResult.status === 'verified' && panResult.status === 'verified') {
      overallStatus = 'VERIFIED';
    } else if (aadhaarResult.status === 'verified' || panResult.status === 'verified') {
      overallStatus = 'PARTIAL';
    }

    // Perform database operations in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create logs
      await tx.verificationLog.createMany({
        data: [
          {
            candidateId,
            verificationType: 'AADHAAR',
            requestPayload: aadhaarRequestPayload as any,
            responsePayload: aadhaarResult as any,
            verificationStatus: aadhaarResult.status === 'verified' ? 'VERIFIED' : 'FAILED',
          },
          {
            candidateId,
            verificationType: 'PAN',
            requestPayload: panRequestPayload as any,
            responsePayload: panResult as any,
            verificationStatus: panResult.status === 'verified' ? 'VERIFIED' : 'FAILED',
          },
        ],
      });

      // 2. Update Candidate status
      const updatedCandidate = await tx.candidate.update({
        where: { id: candidateId },
        data: { status: overallStatus },
        include: {
          verificationLogs: {
            orderBy: { verifiedAt: 'desc' },
          },
        },
      });

      return updatedCandidate;
    });

    // Helper to mask identity numbers in response
    const maskAadhaar = (aadhaar: string) => `XXXX-XXXX-${aadhaar.slice(8)}`;
    const maskPAN = (pan: string) => `XXXXX${pan.slice(5, 9)}X`;

    res.status(200).json({
      message: 'Verification process completed',
      candidate: {
        ...result,
        aadhaarNumber: maskAadhaar(result.aadhaarNumber),
        panNumber: maskPAN(result.panNumber),
      },
    });
  } catch (error) {
    console.error('Start verification error:', error);
    res.status(500).json({ error: 'Verification workflow failed' });
  }
};
