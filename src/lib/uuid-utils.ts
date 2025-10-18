/**
 * UUID validation and utility functions
 */

/**
 * Validates if a string is a valid UUID v4 format
 * @param uuid - The string to validate
 * @returns true if valid UUID v4, false otherwise
 */
export function isValidUUIDv4(uuid: string): boolean {
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidv4Regex.test(uuid);
}

/**
 * Checks if a client_id is in the old string format that needs migration
 * @param clientId - The client_id to check
 * @returns true if it's an old string format, false if it's a valid UUID
 */
export function isLegacyClientId(clientId: string): boolean {
  // Check if it's not a valid UUID v4
  return !isValidUUIDv4(clientId);
}

/**
 * Demo client email for automatic re-login
 */
export const DEMO_CLIENT_EMAIL = 'demo.client@aveniraisolutions.ca';
