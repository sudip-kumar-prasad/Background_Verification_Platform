import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const aadhaarRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const candidateCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  aadhaarNumber: z.string().regex(aadhaarRegex, 'Aadhaar must be exactly 12 numeric digits'),
  panNumber: z.string().regex(panRegex, 'PAN format must be ABCDE1234F'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date of birth format',
  }),
  address: z.string().min(5, 'Address must be at least 5 characters'),
});

const candidateUpdateSchema = candidateCreateSchema.partial();

// Helper to mask Aadhaar: XXXX-XXXX-1234
const maskAadhaar = (aadhaar: string) => {
  if (aadhaar.length !== 12) return aadhaar;
  return `XXXX-XXXX-${aadhaar.slice(8)}`;
};

// Helper to mask PAN: XXXXX1234X
const maskPAN = (pan: string) => {
  if (pan.length !== 10) return pan;
  return `XXXXX${pan.slice(5, 9)}X`;
};

export const createCandidate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = candidateCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { fullName, email, phone, aadhaarNumber, panNumber, dob, address } = parseResult.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const candidate = await prisma.candidate.create({
      data: {
        fullName,
        email,
        phone,
        aadhaarNumber,
        panNumber,
        dob: new Date(dob),
        address,
        status: 'PENDING',
        createdById: userId,
      },
    });

    res.status(201).json({
      message: 'Candidate created successfully',
      candidate: {
        ...candidate,
        aadhaarNumber: maskAadhaar(candidate.aadhaarNumber),
        panNumber: maskPAN(candidate.panNumber),
      },
    });
  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({ error: 'Failed to create candidate' });
  }
};

export const getCandidates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { search, status, page = '1', limit = '10' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build Prisma query filter
    const whereClause: any = {
      createdById: userId,
    };

    if (status) {
      whereClause.status = status as string;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [candidates, total] = await prisma.$transaction([
      prisma.candidate.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
      }),
      prisma.candidate.count({
        where: whereClause,
      }),
    ]);

    const maskedCandidates = candidates.map((candidate) => ({
      ...candidate,
      aadhaarNumber: maskAadhaar(candidate.aadhaarNumber),
      panNumber: maskPAN(candidate.panNumber),
    }));

    res.status(200).json({
      candidates: maskedCandidates,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};

export const getCandidateById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: {
        id,
        createdById: userId,
      },
      include: {
        verificationLogs: {
          orderBy: { verifiedAt: 'desc' },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Prepare response with masked fields for security, but allow checking detail view details.
    const maskedCandidate = {
      ...candidate,
      aadhaarNumber: maskAadhaar(candidate.aadhaarNumber),
      panNumber: maskPAN(candidate.panNumber),
    };

    res.status(200).json({ candidate: maskedCandidate });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ error: 'Failed to fetch candidate details' });
  }
};

export const updateCandidate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const candidateExists = await prisma.candidate.findFirst({
      where: { id, createdById: userId },
    });

    if (!candidateExists) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const parseResult = candidateUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const updateData: any = { ...parseResult.data };
    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob);
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      message: 'Candidate updated successfully',
      candidate: {
        ...updatedCandidate,
        aadhaarNumber: maskAadhaar(updatedCandidate.aadhaarNumber),
        panNumber: maskPAN(updatedCandidate.panNumber),
      },
    });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
};

export const deleteCandidate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const candidateExists = await prisma.candidate.findFirst({
      where: { id, createdById: userId },
    });

    if (!candidateExists) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await prisma.candidate.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
};
