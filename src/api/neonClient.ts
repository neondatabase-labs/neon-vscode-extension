import { createApiClient } from '@neondatabase/api-client';
import { TokenSet } from '../auth/authService';

/**
 * Creates a Neon API client using the provided token set
 * @param tokenSet The OAuth token set
 * @returns A configured Neon API client
 */
export function createNeonApiClient(tokenSet: TokenSet) {
  if (!tokenSet.access_token) {
    throw new Error('No access token available');
  }

  return createApiClient({
    apiKey: tokenSet.access_token
  });
} 