// JWT Helper Functions

interface JWTPayload {
  user_id: number;
  tenant_id: string;
  email: string;
  role: string;
  token_type: string;
  exp: number;
  iat: number;
  nbf: number;
}

/**
 * Decode JWT token and return payload
 * Note: This does NOT verify the signature - only use for client-side display purposes
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Get role from JWT token
 */
export function getRoleFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.role || null;
}

/**
 * Get tenant ID from JWT token
 */
export function getTenantIdFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.tenant_id || null;
}
