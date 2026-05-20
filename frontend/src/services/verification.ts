import API from '@/services/api';

/**
 * Initiates verification workflow for a candidate.
 * Returns the full backend response.
 */
export const startVerification = async (candidateId: string) => {
  return API.post(`/verifications/${candidateId}/start`);
};
