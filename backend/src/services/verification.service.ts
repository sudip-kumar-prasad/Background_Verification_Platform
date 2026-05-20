import dotenv from 'dotenv';

dotenv.config();

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
}

export const verifyAadhaar = async (aadhaarNumber: string): Promise<AadhaarVerificationResponse> => {
  const url = process.env.AADHAAR_API_URL || 'http://localhost:5000/api/mock/aadhaar/verify';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aadhaarNumber }),
    });

    if (!response.ok) {
      throw new Error(`Aadhaar API returned status ${response.status}`);
    }

    return await response.json() as AadhaarVerificationResponse;
  } catch (error: any) {
    console.error('Error in verifyAadhaar service:', error);
    // Return a failed status block instead of crashing the whole workflow
    return {
      status: 'failed',
      nameMatch: false,
      dobMatch: false,
      message: error.message || 'Aadhaar Verification Service Unavailable',
    };
  }
};

export const verifyPAN = async (panNumber: string): Promise<PANVerificationResponse> => {
  const url = process.env.PAN_API_URL || 'http://localhost:5000/api/mock/pan/verify';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ panNumber }),
    });

    if (!response.ok) {
      throw new Error(`PAN API returned status ${response.status}`);
    }

    return await response.json() as PANVerificationResponse;
  } catch (error: any) {
    console.error('Error in verifyPAN service:', error);
    return {
      status: 'failed',
      panStatus: 'inactive',
      message: error.message || 'PAN Verification Service Unavailable',
    };
  }
};
