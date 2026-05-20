import { Response } from 'express';
import prisma from '../config/db';
import { generateReportPDF } from '../services/report.service';
import { AuthenticatedRequest } from '../middleware/auth';

export const downloadReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: candidateId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch candidate details along with verification logs
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        createdById: userId,
      },
      include: {
        verificationLogs: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.status === 'PENDING') {
      return res.status(400).json({
        error: 'Report not generated',
        message: 'Verification check has not been run for this candidate yet.',
      });
    }

    // Fetch the admin/user name
    const reviewer = await prisma.user.findUnique({
      where: { id: userId },
    });
    const reviewerName = reviewer?.name || 'Administrator';

    const pdfBuffer = await generateReportPDF(candidate, reviewerName);

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Verification_Report_${candidate.fullName.replace(/\s+/g, '_')}.pdf`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.end(pdfBuffer);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
};
