import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import prisma from './config/db';

import authRoutes from './routes/auth.routes';
import candidateRoutes from './routes/candidate.routes';
import verificationRoutes from './routes/verification.routes';
import mockRoutes from './routes/mock.routes';
import reportRoutes from './routes/report.routes';

dotenv.config();

// Verify DB connection on startup
prisma
  .$connect()
  .then(() => console.log('✅ Connected to the database'))
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
const app = express();
const PORT = process.env.PORT || 5003;

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: '*', // We can restrict this to the frontend URL later
  credentials: true,
}));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'OK', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'Database connection failed', error });
  }
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/mock', mockRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
