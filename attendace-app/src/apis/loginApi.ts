import { Platform } from 'react-native';

// Resolve backend port and host dynamically
// EXPO_PUBLIC_API_URL environment variable is preferred for simulator and physical device Wi-Fi networks
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.select({
  android: 'http://10.0.2.2:5003',
  ios: 'http://127.0.0.1:5003',
  default: 'http://127.0.0.1:5003',
}) as string);

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  requiresPasswordChange?: boolean;
  user?: {
    id: number;
    email: string;
    organizationId: number;
  };
  organization?: {
    id: number;
    name: string;
    slug: string;
  };
  error?: string;
}

export interface SessionResponse {
  user: {
    id: number;
    email: string;
    organizationId: number;
    phone: string | null;
    profileImageUrl?: string | null;
  };
  organization: {
    id: number;
    name: string;
    slug: string;
    legalName: string | null;
    email: string | null;
  } | null;
  role: string | null;
  roleAssigned: boolean;
  onboardingCompleted: boolean;
  displayName: string;
  permissions: string[];
  faceRegistered: boolean;
  employeeId: number | null;
}

/**
 * Performs a login request to the Node backend API.
 */
export async function loginUser(identifier: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Invalid credentials or login failed.');
    }

    return data;
  } catch (error: any) {
    console.error('[loginApi] loginUser error:', error);
    throw new Error(error.message || 'Network error connecting to auth server.');
  }
}

/**
 * Fetches user profile, role, and permission details using the authorization token.
 */
export async function getUserSession(accessToken: string): Promise<SessionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user permissions.');
    }

    return data;
  } catch (error: any) {
    console.error('[loginApi] getUserSession error:', error);
    throw new Error(error.message || 'Failed to resolve user session from server.');
  }
}

/**
 * Sends a captured face embedding to the backend to verify if it matches the registered face.
 */
export async function verifyFace(accessToken: string, embedding: number[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employees/me/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        embedding,
      }),
    });

    const data = await response.json();

    // Cleanly return false for any 400 Bad Request (mismatches/unregistered biometrics)
    if (response.status === 400) {
      return false;
    }

    if (!response.ok) {
      throw new Error(data.error || 'Face verification failed.');
    }

    return data.success === true;
  } catch (error: any) {
    // Silently return false for mismatch messages in catch blocks
    if (
      error.message &&
      (error.message.includes('Face mismatch') || error.message.includes('Verification failed'))
    ) {
      return false;
    }
    // Only log actual socket exceptions (e.g. Network request failed)
    if (error.message && error.message.includes('Network request failed')) {
      console.warn('[loginApi] verifyFace server unreachable.');
    }
    return false;
  }
}
