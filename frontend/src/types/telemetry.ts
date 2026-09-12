/**
 * Normalized Telemetry Contract & Battery State Interfaces
 * Enforces unified data schema across Live BLE, Virtual Simulator, Demo, and Offline modes.
 */

export type HealthStatus = 'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type BatterySourceMode = 'LIVE_BLE' | 'DEMO' | 'LAST_KNOWN';
export type ConnectionState = 'DISCONNECTED' | 'SCANNING' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface CellTelemetry {
  id: number;
  voltage: number;
  temperature: number;
  deviation: number;
  risk: number;
  status: HealthStatus;
}

export interface PackTelemetry {
  soc: number;
  soh: number;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  maxTemperature: number;
  minTemperature: number;
  internalResistance: number;
  cycleCount: number;
  estimatedRange: number;
  risk: number;
  safetyState: HealthStatus;
}

export interface EnvironmentTelemetry {
  ambientTemperature: number;
}

export interface ChargingTelemetry {
  active: boolean;
  current: number;
  power: number;
  temperature: number;
  durationSeconds: number;
}

export interface RawBleTelemetryPayload {
  protocolVersion: number;
  messageType: 'TELEMETRY';
  sequenceNumber: number;
  timestamp: number;
  pack: PackTelemetry;
  environment: EnvironmentTelemetry;
  charging: ChargingTelemetry;
  cells: CellTelemetry[];
}

export interface BleDiagnosticsData {
  deviceName: string | null;
  deviceId: string | null;
  rssi: number | null;
  connectionState: ConnectionState;
  serviceUuid: string;
  telemetryCharUuid: string;
  notificationsActive: boolean;
  packetsReceived: number;
  packetsLost: number;
  lastSequenceNumber: number | null;
  lastPacketTimestamp: string | null;
  telemetryFrequencyHz: number;
  approxLatencyMs: number;
  connectionDurationSec: number;
}

export interface NormalizedBatteryState {
  source: BatterySourceMode;
  connectionState: ConnectionState;
  deviceName: string | null;
  deviceId: string | null;
  rssi: number | null;
  lastUpdated: string;
  
  // Pack Telemetry
  soc: number;
  soh: number;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  maxTemperature: number;
  minTemperature: number;
  internalResistance: number;
  cycleCount: number;
  estimatedRange: number;
  risk: number;
  safetyState: HealthStatus;

  // Environment & Charging
  ambientTemperature: number;
  charging: ChargingTelemetry;

  // Individual Cells Array (For 3D Digital Twin & Balance Grid)
  cells: CellTelemetry[];

  // Diagnostic Stats
  diagnostics: BleDiagnosticsData;
}
