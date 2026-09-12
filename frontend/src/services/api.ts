/**
 * BRAIN API Client Service
 * Connects Frontend to FastAPI Backend (Production URL or http://localhost:8000/api/v1)
 * Fallbacks seamlessly to Demo/Simulated Mode if offline.
 */

const PRIMARY_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const FALLBACK_API_URL = 'https://brain-backend-wrhg.onrender.com/api/v1';

let activeApiUrl = PRIMARY_API_URL;

async function fetchWithFailover(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Attempt 1: Primary API URL (Local localhost:8000 or custom VITE_API_URL)
  try {
    const res = await fetch(`${activeApiUrl}${endpoint}`, options);
    return res;
  } catch (err) {
    // If primary failed and was local, attempt fallback production URL
    if (activeApiUrl !== FALLBACK_API_URL) {
      try {
        console.warn(`Primary backend ${activeApiUrl} unreachable, trying production server ${FALLBACK_API_URL}...`);
        const fallbackRes = await fetch(`${FALLBACK_API_URL}${endpoint}`, options);
        activeApiUrl = FALLBACK_API_URL; // Lock onto working server
        return fallbackRes;
      } catch {
        // Fallthrough to throw helpful offline error below
      }
    }
    throw new Error('Unable to connect to backend server. Please verify your local backend server is running on port 8000 (run: cd backend && python app/main.py) or check your network connection.');
  }
}

export interface UserLoginPayload {
  email: string;
  password?: string;
}

export interface UserRegisterPayload {
  fullName: string;
  email: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user_id: string | number;
  email: string;
  full_name?: string;
}

export const apiService = {
  getStoredToken(): string | null {
    return localStorage.getItem('brain_access_token');
  },

  setStoredToken(token: string, user?: any): void {
    localStorage.setItem('brain_access_token', token);
    if (user) {
      localStorage.setItem('brain_user_profile', JSON.stringify(user));
    }
  },

  clearStoredToken(): void {
    localStorage.removeItem('brain_access_token');
    localStorage.removeItem('brain_user_profile');
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Check backend health status
   */
  async checkBackendStatus(): Promise<{ online: boolean; system?: string }> {
    try {
      const rootUrl = activeApiUrl.replace(/\/api\/v1\/?$/, '');
      const response = await fetch(`${rootUrl}/`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        return { online: true, system: data.system };
      }
      return { online: false };
    } catch {
      return { online: false };
    }
  },

  /**
   * Fetch authenticated user profile using active JWT token
   */
  async getCurrentUser(): Promise<any> {
    const token = this.getStoredToken();
    if (!token) return null;
    try {
      const response = await fetchWithFailover('/auth/me', {
        headers: this.getAuthHeaders(),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Offline or invalid token
    }
    return null;
  },

  /**
   * User Login API Call (Strict DB Authentication - No Fake Bypass)
   */
  async login(payload: UserLoginPayload): Promise<AuthResponse> {
    const response = await fetchWithFailover('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password || '',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Invalid email or password');
    }

    const data: AuthResponse = await response.json();
    this.setStoredToken(data.access_token, data);
    return data;
  },

  /**
   * User Registration API Call (Strict DB Creation)
   */
  async register(payload: UserRegisterPayload): Promise<AuthResponse> {
    const response = await fetchWithFailover('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password || '',
        fullName: payload.fullName,
        mobile: payload.mobile || '',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    this.setStoredToken(data.access_token, data);
    return data;
  },

  /**
   * Get PKL Simulation Summary from Backend
   */
  async getPklSummary(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/pkl/summary`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { status: 'NO_PKL_LOADED', datasets: [] };
  },

  /**
   * Run PKL Simulation Step from Backend
   */
  async samplePklTelemetry(stepIdx: number = 0): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/pkl/simulate?step_idx=${stepIdx}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Register Connected BLE Hardware BMS Device
   */
  async connectBleDevice(payload: { device_id: str; name: str; rssi?: number; firmware?: str }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/bms/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { status: 'CONNECTED_LOCAL', device_id: payload.device_id };
  },

  /**
   * Post Live Telemetry Packet from BLE BMS Hardware to Backend & Cloud DB
   */
  async postBleTelemetry(payload: {
    battery_id?: str;
    pack_voltage: number;
    pack_current: number;
    pack_temperature: number;
    soc: number;
    soh?: number;
    power_kw?: number;
    bms_status?: str;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/bms/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Get Active BLE Devices Status from Backend
   */
  async getBleDevices(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/bms/devices`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { active_devices: [], total_connected: 0 };
  },
};
