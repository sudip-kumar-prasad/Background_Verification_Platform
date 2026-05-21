import { Request, Response } from 'express';
import prisma from '../config/db';

/**
 * Returns aggregated statistics for the dashboard.
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const totalCandidates = await prisma.candidate.count();
    const verifiedCandidates = await prisma.candidate.count({ where: { status: 'VERIFIED' } });
    const pendingCandidates = await prisma.candidate.count({ where: { status: 'PENDING' } });
    const failedCandidates = await prisma.candidate.count({ where: { status: 'FAILED' } });
    const totalVerifications = await prisma.verificationLog.count();

    return res.status(200).json({
      totalCandidates,
      verifiedCandidates,
      pendingCandidates,
      failedCandidates,
      totalVerifications,
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
