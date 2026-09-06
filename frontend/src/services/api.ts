/**
 * BRAIN API Client Service
 * Connects Frontend to FastAPI Backend (Production URL or http://localhost:8000/api/v1)
 * Fallbacks seamlessly to Demo/Simulated Mode if offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://brain-backend-wrhg.onrender.com/api/v1';
const ROOT_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

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
  user_id: number;
  email: string;
  full_name?: string;
}

export const apiService = {
  /**
   * Check backend health status
   */
  async checkBackendStatus(): Promise<{ online: boolean; system?: string }> {
    try {
      const response = await fetch(`${ROOT_URL}/`, { method: 'GET' });
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
   * User Login API Call
   */
  async login(payload: UserLoginPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password || 'password123',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Authentication failed' }));
        throw new Error(err.detail || 'Login failed');
      }

      return await response.json();
    } catch (err: any) {
      console.warn('Backend API connection offline or error, using local session:', err.message);
      return {
        access_token: 'demo_token_2026',
        user_id: 1,
        email: payload.email,
        full_name: 'Researcher / Operator',
      };
    }
  },

  /**
   * User Registration API Call
   */
  async register(payload: UserRegisterPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password || 'password123',
          fullName: payload.fullName,
          mobile: payload.mobile || '',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(err.detail || 'Registration failed');
      }

      return await response.json();
    } catch (err: any) {
      console.warn('Backend API connection offline or error, registering locally:', err.message);
      return {
        access_token: 'demo_token_registered',
        user_id: 2,
        email: payload.email,
        full_name: payload.fullName,
      };
    }
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
