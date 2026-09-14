/**
 * BRAIN API & Authentication Client Service
 * EV Battery Risk & Analytics Intelligence Network
 * 
 * Multi-Tier Authentication Strategy:
 * 1. Firebase Cloud Auth (When VITE_FIREBASE_API_KEY is set in .env)
 * 2. Supabase Cloud Auth (When VITE_SUPABASE_URL is set in .env)
 * 3. FastAPI Backend Server (Local localhost:8000 or Cloud Render)
 * 4. Local DB Persistence Sync (Zero-block fallback so authentication works anywhere without errors)
 */

import { firebaseAuth, isFirebaseConfigured } from './firebaseClient';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

import { supabase, isSupabaseConfigured } from './supabaseClient';

const PRIMARY_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const FALLBACK_API_URL = 'https://brain-backend-wrhg.onrender.com/api/v1';

let activeApiUrl = PRIMARY_API_URL;

async function fetchWithFailover(endpoint: string, options: RequestInit = {}): Promise<Response> {
  try {
    const res = await fetch(`${activeApiUrl}${endpoint}`, options);
    return res;
  } catch {
    if (activeApiUrl !== FALLBACK_API_URL) {
      try {
        const fallbackRes = await fetch(`${FALLBACK_API_URL}${endpoint}`, options);
        activeApiUrl = FALLBACK_API_URL;
        return fallbackRes;
      } catch {
        // Fallthrough
      }
    }
    throw new Error('BACKEND_OFFLINE');
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
  role?: string;
  evModel?: string;
  batteryChemistry?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user_id: string | number;
  email: string;
  full_name?: string;
  role?: string;
  ev_model?: string;
  battery_chemistry?: string;
}

const LOCAL_USERS_DB_KEY = 'brain_registered_users_db';

function getLocalUsersDB(): Record<string, any> {
  try {
    const data = localStorage.getItem(LOCAL_USERS_DB_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveLocalUserDB(email: string, userData: any) {
  const db = getLocalUsersDB();
  db[email.toLowerCase()] = userData;
  localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(db));
}

export const apiService = {
  getStoredToken(): string | null {
    try {
      return localStorage.getItem('brain_access_token');
    } catch {
      return null;
    }
  },

  setStoredToken(token: string, user?: any): void {
    try {
      localStorage.setItem('brain_access_token', token);
      if (user) {
        localStorage.setItem('brain_user_profile', JSON.stringify(user));
        if (user.email) {
          const emailKey = user.email.toLowerCase().trim();
          localStorage.setItem('brain_current_logged_email', emailKey);
          localStorage.setItem(`brain_profile_${emailKey}`, JSON.stringify(user));
        }
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  clearStoredToken(): void {
    try {
      localStorage.removeItem('brain_access_token');
      localStorage.removeItem('brain_user_profile');
      localStorage.removeItem('brain_current_logged_email');
      if (isSupabaseConfigured() && supabase) {
        supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.warn('LocalStorage clear failed:', e);
    }
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
  async checkBackendStatus(): Promise<{ online: boolean; system?: string; mode: string }> {
    if (isFirebaseConfigured()) {
      return { online: true, system: 'Google Firebase Cloud Auth', mode: 'FIREBASE_CLOUD' };
    }
    if (isSupabaseConfigured()) {
      return { online: true, system: 'Supabase Cloud PostgreSQL', mode: 'SUPABASE_CLOUD' };
    }
    try {
      const rootUrl = activeApiUrl.replace(/\/api\/v1\/?$/, '');
      const response = await fetch(`${rootUrl}/`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        return { online: true, system: data.system, mode: 'FASTAPI_BACKEND' };
      }
    } catch {
      // Offline
    }
    return { online: true, system: 'BRAIN Local DB Active', mode: 'LOCAL_PERSISTENT_DB' };
  },

  /**
   * Fetch authenticated user profile (strictly isolated per user email)
   */
  async getCurrentUser(): Promise<any> {
    const token = this.getStoredToken();
    if (!token) return null;

    const activeEmail = localStorage.getItem('brain_current_logged_email')?.toLowerCase().trim();

    // 1. Firebase Auth check
    if (isFirebaseConfigured() && firebaseAuth?.currentUser) {
      const user: FirebaseUser = firebaseAuth.currentUser;
      const fbEmail = user.email?.toLowerCase().trim();
      if (!activeEmail || fbEmail === activeEmail) {
        const storedProfile = activeEmail ? localStorage.getItem(`brain_profile_${activeEmail}`) : localStorage.getItem('brain_user_profile');
        const parsed = storedProfile ? JSON.parse(storedProfile) : {};
        return {
          id: user.uid,
          email: user.email,
          full_name: user.displayName || parsed.full_name || 'EV Operator',
          role: parsed.role || 'EV Rider / Owner',
          ev_model: parsed.ev_model || 'Ather 450X',
          battery_chemistry: parsed.battery_chemistry || 'NMC',
        };
      }
    }

    // 2. Supabase Auth check
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const sbEmail = data.user.email?.toLowerCase().trim();
          // STRICT CHECK: Only use Supabase user if it matches active logged email!
          if (sbEmail && (!activeEmail || sbEmail === activeEmail)) {
            const localUsers = getLocalUsersDB();
            const localRec = localUsers[sbEmail];
            return {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || localRec?.fullName || localRec?.full_name || 'EV Operator',
              role: data.user.user_metadata?.role || localRec?.role || 'EV Rider / Owner',
              ev_model: data.user.user_metadata?.ev_model || localRec?.evModel || localRec?.ev_model || 'Ather 450X',
              battery_chemistry: data.user.user_metadata?.battery_chemistry || localRec?.batteryChemistry || 'NMC',
            };
          }
        }
      } catch {
        // Fallthrough
      }
    }

    // 3. FastAPI Backend check
    try {
      const response = await fetchWithFailover('/auth/me', {
        headers: this.getAuthHeaders(),
      });
      if (response.ok) {
        const backendUser = await response.json();
        if (!activeEmail || backendUser.email?.toLowerCase().trim() === activeEmail) {
          return backendUser;
        }
      }
    } catch {
      // Fallthrough
    }

    // 4. Local stored profile fallback matching active logged email strictly
    try {
      if (activeEmail) {
        const specificProfile = localStorage.getItem(`brain_profile_${activeEmail}`);
        if (specificProfile) return JSON.parse(specificProfile);
        const localUsers = getLocalUsersDB();
        const userRec = localUsers[activeEmail];
        if (userRec) {
          return {
            id: userRec.id || `usr_${Date.now()}`,
            email: activeEmail,
            full_name: userRec.fullName || userRec.full_name || 'EV Operator',
            role: userRec.role || 'EV Rider / Owner',
            ev_model: userRec.evModel || userRec.ev_model || 'Ather 450X',
            battery_chemistry: userRec.batteryChemistry || userRec.battery_chemistry || 'NMC',
          };
        }
      }
      const profile = localStorage.getItem('brain_user_profile');
      if (profile) return JSON.parse(profile);
    } catch {
      // Fallthrough
    }

    return null;
  },

  /**
   * User Login API Call (Firebase -> Supabase -> FastAPI -> Local DB)
   */
  async login(payload: UserLoginPayload): Promise<AuthResponse> {
    const emailKey = payload.email.toLowerCase().trim();
    const password = payload.password || '';

    // Clear stale session if switching accounts to prevent name swapping
    const activeEmail = localStorage.getItem('brain_current_logged_email')?.toLowerCase().trim();
    if (activeEmail && activeEmail !== emailKey) {
      this.clearStoredToken();
    }

    // TIER 1: Firebase Cloud Auth
    if (isFirebaseConfigured() && firebaseAuth) {
      try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, emailKey, password);
        const fbUser = userCredential.user;
        const idToken = await fbUser.getIdToken();

        const localUsers = getLocalUsersDB();
        const userRecord = localUsers[emailKey] || {};

        const authData: AuthResponse = {
          access_token: idToken,
          user_id: fbUser.uid,
          email: fbUser.email || emailKey,
          full_name: fbUser.displayName || userRecord.fullName || 'EV Operator',
          role: userRecord.role || 'EV Rider / Owner',
          ev_model: userRecord.evModel || 'Ather 450X / Ola S1',
          battery_chemistry: userRecord.batteryChemistry || 'NMC (Nickel Manganese Cobalt)',
        };
        this.setStoredToken(authData.access_token, authData);
        return authData;
      } catch (fbErr: any) {
        let msg = 'Firebase login failed.';
        if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password') {
          msg = 'Invalid email or password.';
        } else if (fbErr.code === 'auth/user-not-found') {
          msg = 'No account found with this email address.';
        }
        throw new Error(msg);
      }
    }

    // TIER 2: Supabase Cloud Auth
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailKey,
        password: password,
      });

      if (!error && data?.session) {
        const userMeta = data.user?.user_metadata || {};
        const localUsers = getLocalUsersDB();
        const localRecord = localUsers[emailKey] || {};

        const authData: AuthResponse = {
          access_token: data.session.access_token,
          user_id: data.user.id,
          email: data.user.email || emailKey,
          full_name: userMeta.full_name || localRecord.fullName || localRecord.full_name || 'EV Operator',
          role: userMeta.role || localRecord.role || 'EV Rider / Owner',
          ev_model: userMeta.ev_model || localRecord.evModel || localRecord.ev_model || 'Ather 450X',
          battery_chemistry: userMeta.battery_chemistry || localRecord.batteryChemistry || 'NMC',
        };

        // Sync to Supabase public profiles table
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: emailKey,
            full_name: authData.full_name,
            role: authData.role,
            ev_model: authData.ev_model,
            battery_chemistry: authData.battery_chemistry,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // Ignore DB sync errors
        }

        saveLocalUserDB(emailKey, authData);
        this.setStoredToken(authData.access_token, authData);
        return authData;
      }
    }

    // TIER 3: FastAPI Backend Server (Real SQL Online Database)
    try {
      const response = await fetchWithFailover('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailKey, password }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        const localUsers = getLocalUsersDB();
        const userRecord = localUsers[emailKey] || {};
        data.role = data.role || userRecord.role || 'EV Rider / Owner';
        data.ev_model = data.ev_model || userRecord.evModel || 'Ather 450X';
        data.battery_chemistry = data.battery_chemistry || userRecord.batteryChemistry || 'NMC';
        saveLocalUserDB(emailKey, data);
        this.setStoredToken(data.access_token, data);
        return data;
      }
    } catch {
      // Backend offline or error -> Fallthrough
    }

    // TIER 4: Cloud DB Profile & Cross-Device Sync Fallback
    const localUsers = getLocalUsersDB();
    const localRecord = localUsers[emailKey];

    if (localRecord && localRecord.password && localRecord.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    // Query Supabase Cloud profiles table directly
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: cloudProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailKey)
          .maybeSingle();

        if (cloudProfile) {
          const storedPass = cloudProfile.password_hash || cloudProfile.password;
          if (storedPass && storedPass !== password) {
            throw new Error('Incorrect password. Please verify your credentials.');
          }

          const authData: AuthResponse = {
            access_token: `sb_cloud_token_${Date.now()}`,
            user_id: cloudProfile.id || `usr_${Date.now()}`,
            email: cloudProfile.email || emailKey,
            full_name: cloudProfile.full_name || cloudProfile.fullName || localRecord?.fullName || localRecord?.full_name || 'EV Operator',
            role: cloudProfile.role || localRecord?.role || 'EV Rider / Owner',
            ev_model: cloudProfile.ev_model || localRecord?.evModel || localRecord?.ev_model || 'Ather 450X',
            battery_chemistry: cloudProfile.battery_chemistry || localRecord?.batteryChemistry || 'NMC',
          };
          saveLocalUserDB(emailKey, authData);
          this.setStoredToken(authData.access_token, authData);
          return authData;
        }
      } catch {
        // Ignore RLS errors
      }
    }

    // Check local storage record for offline / same-device persistence
    if (localRecord) {
      if (localRecord.password && localRecord.password !== password) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }

      const authData: AuthResponse = {
        access_token: `local_jwt_token_${Date.now()}`,
        user_id: localRecord.id || `usr_${Date.now()}`,
        email: emailKey,
        full_name: localRecord.fullName || localRecord.full_name || 'EV Operator',
        role: localRecord.role || 'EV Rider / Owner',
        ev_model: localRecord.evModel || localRecord.ev_model || 'Ather 450X',
        battery_chemistry: localRecord.batteryChemistry || 'NMC',
      };
      saveLocalUserDB(emailKey, authData);
      this.setStoredToken(authData.access_token, authData);
      return authData;
    }

    // Unregistered Account Protection: Reject login if account does not exist in any database
    throw new Error('No account found with this email address. Please register a new account.');
  },

  /**
   * User Registration API Call (Saves User to DB without auto-login)
   */
  async register(payload: UserRegisterPayload): Promise<{ success: boolean; email: string }> {
    const emailKey = payload.email.toLowerCase().trim();

    // Save record to Local DB Persistence
    const newUserRecord = {
      id: `usr_${Date.now()}`,
      fullName: payload.fullName,
      email: emailKey,
      mobile: payload.mobile,
      password: payload.password,
      role: payload.role || 'EV Rider / Owner',
      evModel: payload.evModel || 'Ather 450X / Ola S1',
      batteryChemistry: payload.batteryChemistry || 'NMC (Nickel Manganese Cobalt)',
      created_at: new Date().toISOString(),
    };
    saveLocalUserDB(emailKey, newUserRecord);

    // TIER 1: Firebase Cloud Auth Registration
    if (isFirebaseConfigured() && firebaseAuth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, emailKey, payload.password || '');
        const fbUser = userCredential.user;
        await updateProfile(fbUser, { displayName: payload.fullName });
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error('Email address is already registered. Please sign in instead.');
        } else if (fbErr.code === 'auth/weak-password') {
          throw new Error('Password should be at least 6 characters long.');
        }
      }
    }

    // TIER 2: Supabase Cloud Auth Registration
    if (isSupabaseConfigured() && supabase) {
      // Always sync user record to Supabase public profiles table for cross-browser login support
      try {
        await supabase.from('profiles').upsert({
          id: `usr_${Date.now()}`,
          email: emailKey,
          full_name: payload.fullName,
          mobile: payload.mobile || '',
          password_hash: payload.password || '',
          role: payload.role || 'EV Rider / Owner',
          ev_model: payload.evModel || 'Ather 450X',
          battery_chemistry: payload.batteryChemistry || 'NMC',
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Ignore DB sync errors
      }

      const { error } = await supabase.auth.signUp({
        email: emailKey,
        password: payload.password || '',
        options: {
          data: {
            full_name: payload.fullName,
            mobile: payload.mobile || '',
            role: payload.role || 'EV Rider / Owner',
            ev_model: payload.evModel || 'Ather 450X',
            battery_chemistry: payload.batteryChemistry || 'NMC',
          },
        },
      });

      if (error) {
        const errLower = (error.message || '').toLowerCase();
        if (errLower.includes('rate limit') || errLower.includes('exceeded') || errLower.includes('email')) {
          // Seamless completion when Supabase email rate limit is hit
          saveLocalUserDB(emailKey, newUserRecord);
          return { success: true, email: emailKey };
        }
        if (errLower.includes('already registered') || errLower.includes('already in use') || errLower.includes('exists')) {
          throw new Error('Email address is already registered. Please sign in instead.');
        }
        // Fallback save to local DB
        saveLocalUserDB(emailKey, newUserRecord);
        return { success: true, email: emailKey };
      }
    }

    // TIER 3: FastAPI Backend Server Registration
    try {
      await fetchWithFailover('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailKey,
          password: payload.password || '',
          fullName: payload.fullName,
          mobile: payload.mobile || '',
        }),
      });
    } catch {
      // Offline fallback already stored in local DB
    }

    // Note: Do NOT setStoredToken() here so user must sign in via Login Screen
    return { success: true, email: emailKey };
  },

  /**
   * Update User Profile Details & Specs across Backend / Cloud DB / Local DB
   */
  async updateUserProfile(updatedUser: any): Promise<any> {
    // 1. Update Supabase User Metadata if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: updatedUser.full_name,
            mobile: updatedUser.mobile,
            role: updatedUser.role,
            ev_model: updatedUser.ev_model,
            battery_chemistry: updatedUser.battery_chemistry,
          },
        });

        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: updatedUser.full_name,
              mobile: updatedUser.mobile,
              role: updatedUser.role,
              ev_model: updatedUser.ev_model,
              battery_chemistry: updatedUser.battery_chemistry,
              updated_at: new Date().toISOString(),
            });
          } catch {
            // Ignore DB sync errors
          }
        }
      } catch {
        // Fallthrough
      }
    }

    // 2. Update FastAPI Backend Server
    try {
      await fetchWithFailover('/auth/me', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updatedUser),
      });
    } catch {
      // Fallthrough
    }

    // 3. Update Local Storage Profile
    const emailKey = (updatedUser.email || '').toLowerCase().trim();
    if (emailKey) {
      localStorage.setItem(`brain_profile_${emailKey}`, JSON.stringify(updatedUser));
      saveLocalUserDB(emailKey, updatedUser);
    }
    localStorage.setItem('brain_user_profile', JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Get PKL Simulation Summary from Backend
   */
  async getPklSummary(): Promise<any> {
    try {
      const res = await fetchWithFailover('/pkl/summary');
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
      const res = await fetchWithFailover(`/pkl/simulate?step_idx=${stepIdx}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Register Connected BLE Hardware BMS Device
   */
  async connectBleDevice(payload: { device_id: string; name: string; rssi?: number; firmware?: string }): Promise<any> {
    try {
      const res = await fetchWithFailover('/bms/connect', {
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
    battery_id?: string;
    pack_voltage: number;
    pack_current: number;
    pack_temperature: number;
    soc: number;
    soh?: number;
    power_kw?: number;
    bms_status?: string;
  }): Promise<any> {
    try {
      const res = await fetchWithFailover('/bms/telemetry', {
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
      const res = await fetchWithFailover('/bms/devices');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { active_devices: [], total_connected: 0 };
  },

  /**
   * Fetch Live Digital Twin Physics Telemetry Packet from Backend
   */
  async getLiveDigitalTwinTelemetry(): Promise<any> {
    try {
      const res = await fetchWithFailover('/bms/telemetry');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Inject or Clear Physical Fault Scenario into Digital Twin
   */
  async injectDigitalTwinFault(fault: string, cell_id: number = 5, active: boolean = true): Promise<any> {
    try {
      const res = await fetchWithFailover('/bms/fault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fault, cell_id, active }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Update Digital Twin Load Current or Simulation Mode
   */
  async updateDigitalTwinState(load_current_A?: number, sim_mode?: string): Promise<any> {
    try {
      const res = await fetchWithFailover('/bms/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load_current_A, sim_mode }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return null;
  },
};
