import type {
  NormalizedBatteryState,
  RawBleTelemetryPayload,
  BatterySourceMode,
  ConnectionState,
  HealthStatus,
  CellTelemetry,
} from '../types/telemetry';
import { BLE_CONFIG } from './bleConfig';

export type BatteryStateListener = (state: NormalizedBatteryState) => void;

class BatteryStateService {
  private listeners: Set<BatteryStateListener> = new Set();
  private connectionStartTime: number | null = null;
  private lastPacketArrivalMs: number | null = null;

  // Default Default/Demo Initial State
  private state: NormalizedBatteryState = {
    source: 'DEMO',
    connectionState: 'DISCONNECTED',
    deviceName: null,
    deviceId: null,
    rssi: null,
    lastUpdated: new Date().toISOString(),
    soc: 84.0,
    soh: 96.4,
    voltage: 350.4,
    current: 120.5,
    power: 42.2,
    temperature: 34.2,
    maxTemperature: 35.1,
    minTemperature: 32.8,
    internalResistance: 1.2,
    cycleCount: 428,
    estimatedRange: 342,
    risk: 2,
    safetyState: 'HEALTHY',
    ambientTemperature: 29.0,
    charging: {
      active: false,
      current: 0,
      power: 0,
      temperature: 34.2,
      durationSeconds: 0,
    },
    cells: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      voltage: 3.72,
      temperature: 33.1 + (i === 2 ? 1.2 : 0),
      deviation: 0.01,
      risk: i === 2 ? 15 : 2,
      status: 'HEALTHY' as HealthStatus,
    })),
    diagnostics: {
      deviceName: null,
      deviceId: null,
      rssi: null,
      connectionState: 'DISCONNECTED',
      serviceUuid: BLE_CONFIG.SERVICE_UUID,
      telemetryCharUuid: BLE_CONFIG.TELEMETRY_CHAR_UUID,
      notificationsActive: false,
      packetsReceived: 0,
      packetsLost: 0,
      lastSequenceNumber: null,
      lastPacketTimestamp: null,
      telemetryFrequencyHz: 0,
      approxLatencyMs: 0,
      connectionDurationSec: 0,
    },
  };

  /**
   * Subscribe to global normalized battery state updates
   */
  public subscribe(listener: BatteryStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snapshot));
  }

  /**
   * Get immutable snapshot of current state
   */
  public getSnapshot(): NormalizedBatteryState {
    let durationSec = this.state.diagnostics.connectionDurationSec;
    if (this.connectionStartTime && this.state.connectionState === 'CONNECTED') {
      durationSec = Math.floor((Date.now() - this.connectionStartTime) / 1000);
    }

    return {
      ...this.state,
      charging: { ...this.state.charging },
      cells: this.state.cells.map((c) => ({ ...c })),
      diagnostics: {
        ...this.state.diagnostics,
        connectionDurationSec: durationSec,
      },
    };
  }

  /**
   * Validate incoming raw BLE telemetry payload against contract schema
   */
  public validateTelemetryPayload(data: any): data is RawBleTelemetryPayload {
    if (!data || typeof data !== 'object') return false;
    if (data.protocolVersion !== BLE_CONFIG.PROTOCOL_VERSION) return false;
    if (data.messageType !== 'TELEMETRY') return false;
    if (typeof data.sequenceNumber !== 'number') return false;
    if (!data.pack || typeof data.pack.soc !== 'number' || typeof data.pack.voltage !== 'number') return false;
    return true;
  }

  /**
   * Process and ingest live BLE telemetry packet
   */
  public processLiveBleTelemetry(
    payload: RawBleTelemetryPayload,
    deviceInfo: { name: string; id: string; rssi?: number }
  ) {
    const nowMs = Date.now();
    let approxLatencyMs = 0;
    if (payload.timestamp && payload.timestamp > 0) {
      approxLatencyMs = Math.max(0, nowMs - payload.timestamp);
    } else if (this.lastPacketArrivalMs) {
      approxLatencyMs = Math.max(0, nowMs - this.lastPacketArrivalMs);
    }
    this.lastPacketArrivalMs = nowMs;

    let packetsLost = this.state.diagnostics.packetsLost;
    const lastSeq = this.state.diagnostics.lastSequenceNumber;
    if (lastSeq !== null && payload.sequenceNumber > lastSeq + 1) {
      packetsLost += payload.sequenceNumber - lastSeq - 1;
    }

    const packetsReceived = this.state.diagnostics.packetsReceived + 1;

    this.state = {
      ...this.state,
      source: 'LIVE_BLE',
      connectionState: 'CONNECTED',
      deviceName: deviceInfo.name,
      deviceId: deviceInfo.id,
      rssi: deviceInfo.rssi ?? this.state.rssi ?? -62,
      lastUpdated: new Date().toISOString(),

      soc: payload.pack.soc,
      soh: payload.pack.soh,
      voltage: payload.pack.voltage,
      current: payload.pack.current,
      power: payload.pack.power,
      temperature: payload.pack.temperature,
      maxTemperature: payload.pack.maxTemperature || payload.pack.temperature,
      minTemperature: payload.pack.minTemperature || payload.pack.temperature,
      internalResistance: payload.pack.internalResistance || 1.2,
      cycleCount: payload.pack.cycleCount || 428,
      estimatedRange: payload.pack.estimatedRange || Math.round(payload.pack.soc * 4.1),
      risk: payload.pack.risk,
      safetyState: payload.pack.safetyState || 'HEALTHY',

      ambientTemperature: payload.environment?.ambientTemperature ?? 29.0,
      charging: payload.charging || {
        active: false,
        current: 0,
        power: 0,
        temperature: payload.pack.temperature,
        durationSeconds: 0,
      },

      cells: payload.cells && payload.cells.length > 0
        ? payload.cells.map((c) => ({
            id: c.id,
            voltage: c.voltage,
            temperature: c.temperature,
            deviation: c.deviation || 0,
            risk: c.risk || 0,
            status: c.status || 'HEALTHY',
          }))
        : this.state.cells,

      diagnostics: {
        ...this.state.diagnostics,
        deviceName: deviceInfo.name,
        deviceId: deviceInfo.id,
        rssi: deviceInfo.rssi ?? this.state.rssi ?? -62,
        connectionState: 'CONNECTED',
        notificationsActive: true,
        packetsReceived,
        packetsLost,
        lastSequenceNumber: payload.sequenceNumber,
        lastPacketTimestamp: new Date().toISOString(),
        telemetryFrequencyHz: 1.0,
        approxLatencyMs,
      },
    };

    this.notify();
  }

  /**
   * Set Connection State (Scanning, Connecting, Reconnecting)
   */
  public setConnectionState(
    connState: ConnectionState,
    deviceInfo?: { name?: string; id?: string; rssi?: number }
  ) {
    if (connState === 'CONNECTED' && !this.connectionStartTime) {
      this.connectionStartTime = Date.now();
    } else if (connState === 'DISCONNECTED') {
      this.connectionStartTime = null;
    }

    const newSource: BatterySourceMode =
      connState === 'CONNECTED'
        ? 'LIVE_BLE'
        : this.state.source === 'LIVE_BLE'
        ? 'LAST_KNOWN'
        : this.state.source;

    this.state = {
      ...this.state,
      source: newSource,
      connectionState: connState,
      deviceName: deviceInfo?.name || this.state.deviceName,
      deviceId: deviceInfo?.id || this.state.deviceId,
      rssi: deviceInfo?.rssi ?? this.state.rssi,
      diagnostics: {
        ...this.state.diagnostics,
        connectionState: connState,
        deviceName: deviceInfo?.name || this.state.deviceName,
        deviceId: deviceInfo?.id || this.state.deviceId,
        notificationsActive: connState === 'CONNECTED',
      },
    };

    this.notify();
  }

  /**
   * Explicitly set Demo Mode
   */
  public setDemoMode(active: boolean) {
    this.state = {
      ...this.state,
      source: active ? 'DEMO' : 'LAST_KNOWN',
    };
    this.notify();
  }
}

export const batteryStateService = new BatteryStateService();
export default batteryStateService;
