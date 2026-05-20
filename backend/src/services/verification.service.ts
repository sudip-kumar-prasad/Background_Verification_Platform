import axios from 'axios';
import dotenv from 'dotenv';
import prisma from '../config/db';

export interface AadhaarVerificationResponse {
  status: 'verified' | 'failed';
  nameMatch: boolean;
  dobMatch: boolean;
  message: string;
}

export interface PANVerificationResponse {
  status: 'verified' | 'failed';
  panStatus: 'active' | 'inactive';
  message: string;
  fullName?: string;
}

/**
 * Calls the mock Aadhaar verification API.
 * On failure returns a structured failed response so the workflow can continue.
 */
export const verifyAadhaar = async (aadhaarNumber: string): Promise<AadhaarVerificationResponse> => {
  const url = process.env.AADHAAR_API_URL || 'http://localhost:5000/api/mock/aadhaar/verify';
  try {
    const { data } = await axios.post<AadhaarVerificationResponse>(url, { aadhaarNumber });
    return data;
  } catch (error: any) {
    console.error('Aadhaar verification error:', error);
    return {
      status: 'failed',
      nameMatch: false,
      dobMatch: false,
      message: error?.response?.data?.message || error.message || 'Aadhaar service unavailable',
    };
  }
};

/**
 * Calls the mock PAN verification API.
 * Returns a failed response on any error.
 */
export const verifyPAN = async (panNumber: string): Promise<PANVerificationResponse> => {
  const url = process.env.PAN_API_URL || 'http://localhost:5000/api/mock/pan/verify';
  try {
    const { data } = await axios.post<PANVerificationResponse>(url, { panNumber });
    return data;
  } catch (error: any) {
    console.error('PAN verification error:', error);
    return {
      status: 'failed',
      panStatus: 'inactive',
      message: error?.response?.data?.message || error.message || 'PAN service unavailable',
    };
  }
};

/**
 * Persists a verification log entry in the database.
 */
export const createVerificationLog = async (
  candidateId: string,
  verificationType: 'AADHAAR' | 'PAN',
  verificationStatus: 'VERIFIED' | 'FAILED',
  requestPayload: any,
  responsePayload: any,
) => {
  try {
    await prisma.verificationLog.create({
      data: {
        candidateId,
        verificationType,
        verificationStatus,
        requestPayload,
        responsePayload,
      },
    });
  } catch (e) {
    console.error('Failed to create verification log:', e);
  }
};
