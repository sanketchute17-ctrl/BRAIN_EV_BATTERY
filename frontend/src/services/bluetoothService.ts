/**
 * BRAIN EV Web Bluetooth (BLE) GATT Peripheral & Telemetry Service
 * Implements real BLE GATT Client scanning, service discovery, characteristic notifications,
 * packet decoding, automatic reconnection backoff, and virtual peripheral simulation.
 */

import { BLE_CONFIG } from './bleConfig';
import { batteryStateService } from './batteryStateService';
import type { RawBleTelemetryPayload } from '../types/telemetry';
import { apiService } from './api';

export interface DiscoveredBleDevice {
  id: string;
  name: string;
  rssi: number;
  deviceObj?: any;
}

class BluetoothService {
  private gattServer: any = null;
  private bleDevice: any = null;
  private telemetryCharacteristic: any = null;
  private isVirtualGattActive: boolean = false;
  private virtualTimer: any = null;
  private sequenceCounter: number = 100;
  private reconnectAttempts: number = 0;
  private isManualDisconnect: boolean = false;

  /**
   * Check Web Bluetooth API availability
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Trigger Web Bluetooth Scan for BRAIN-VIRTUAL-BMS GATT Peripherals
   */
  public async scanAndConnectDevice(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Android Web View.');
    }

    this.isManualDisconnect = false;
    batteryStateService.setConnectionState('SCANNING');

    try {
      // 1. Request BLE Device filter
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: BLE_CONFIG.DEVICE_NAME_PREFIX },
          { namePrefix: 'BRAIN-' },
        ],
        optionalServices: [
          BLE_CONFIG.SERVICE_UUID,
          BLE_CONFIG.BATTERY_SERVICE_UUID,
          BLE_CONFIG.DEVICE_INFO_SERVICE_UUID,
          'battery_service',
        ],
      }).catch(async () => {
        // Fallback: accept all devices if prefix filter produces no result modal
        return await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            BLE_CONFIG.SERVICE_UUID,
            BLE_CONFIG.BATTERY_SERVICE_UUID,
            BLE_CONFIG.DEVICE_INFO_SERVICE_UUID,
            'battery_service',
          ],
        });
      });

      if (!device) {
        batteryStateService.setConnectionState('DISCONNECTED');
        throw new Error('No device selected.');
      }

      this.bleDevice = device;
      const deviceId = device.id || `BLE-${Math.floor(1000 + Math.random() * 9000)}`;
      const deviceName = device.name || BLE_CONFIG.DEVICE_NAME_PREFIX;

      // Handle GATT link loss
      device.addEventListener('gattserverdisconnected', () => {
        this.handleGattDisconnected();
      });

      // 2. Connect to GATT Server
      batteryStateService.setConnectionState('CONNECTING', { name: deviceName, id: deviceId, rssi: -55 });

      const server = await device.gatt.connect();
      this.gattServer = server;

      // 3. Discover GATT Services & Telemetry Characteristic
      await this.discoverServicesAndSubscribe(server, { name: deviceName, id: deviceId });

      // Register connected device on FastAPI backend
      apiService.connectBleDevice({
        device_id: deviceId,
        name: deviceName,
        rssi: -55,
        firmware: 'v2.4.1-BLE-GATT',
      }).catch(() => {});

      this.reconnectAttempts = 0;
    } catch (err: any) {
      batteryStateService.setConnectionState('DISCONNECTED');
      if (err.name === 'NotFoundError') {
        throw new Error('BLE device scan cancelled.');
      }
      throw new Error(err.message || 'BLE GATT Connection failed.');
    }
  }

  /**
   * Discover GATT Services and Subscribe to Live Telemetry Notifications
   */
  private async discoverServicesAndSubscribe(
    server: any,
    deviceInfo: { name: string; id: string }
  ): Promise<void> {
    try {
      let service: any = null;

      // Try primary custom service UUID
      try {
        service = await server.getPrimaryService(BLE_CONFIG.SERVICE_UUID);
      } catch (e) {
        // Fallback to primary services list
        const services = await server.getPrimaryServices();
        if (services && services.length > 0) {
          service = services[0];
        }
      }

      if (!service) {
        throw new Error('BRAIN Battery Telemetry Service not found on GATT Server.');
      }

      // Discover Telemetry Characteristic
      let char: any = null;
      try {
        char = await service.getCharacteristic(BLE_CONFIG.TELEMETRY_CHAR_UUID);
      } catch (e) {
        const characteristics = await service.getCharacteristics();
        if (characteristics && characteristics.length > 0) {
          char = characteristics[0];
        }
      }

      if (!char) {
        throw new Error('BRAIN Telemetry Characteristic not found.');
      }

      this.telemetryCharacteristic = char;

      // Subscribe to GATT Notifications
      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', (event: any) => {
        this.handleIncomingGattPacket(event, deviceInfo);
      });

      batteryStateService.setConnectionState('CONNECTED', { name: deviceInfo.name, id: deviceInfo.id, rssi: -55 });
    } catch (err: any) {
      throw new Error(`GATT Service Discovery Error: ${err.message}`);
    }
  }

  /**
   * Parse & Validate Incoming GATT Notification Data Packet
   */
  private handleIncomingGattPacket(event: any, deviceInfo: { name: string; id: string }) {
    try {
      const value: DataView = event.target.value;
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(value);
      const parsedData = JSON.parse(jsonString);

      if (batteryStateService.validateTelemetryPayload(parsedData)) {
        batteryStateService.processLiveBleTelemetry(parsedData, deviceInfo);

        // Periodically post telemetry to FastAPI backend
        apiService.postBleTelemetry({
          battery_id: deviceInfo.id,
          pack_voltage: parsedData.pack.voltage,
          pack_current: parsedData.pack.current,
          pack_temperature: parsedData.pack.temperature,
          soc: parsedData.pack.soc,
          soh: parsedData.pack.soh,
          power_kw: parsedData.pack.power,
          bms_status: parsedData.pack.safetyState,
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[BLE GATT PARSE WARNING] Ignored invalid packet payload:', err);
    }
  }

  /**
   * Handle Unexpected GATT Disconnection
   */
  private handleGattDisconnected() {
    if (this.isManualDisconnect) {
      batteryStateService.setConnectionState('DISCONNECTED');
      return;
    }

    batteryStateService.setConnectionState('RECONNECTING');

    // Attempt controlled reconnection with exponential backoff
    if (this.reconnectAttempts < BLE_CONFIG.MAX_RECONNECT_RETRIES) {
      this.reconnectAttempts++;
      const delay = Math.min(
        BLE_CONFIG.INITIAL_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
        BLE_CONFIG.MAX_RECONNECT_DELAY_MS
      );

      setTimeout(() => {
        if (this.bleDevice && this.bleDevice.gatt) {
          this.bleDevice.gatt.connect()
            .then((server: any) => {
              const name = this.bleDevice.name || BLE_CONFIG.DEVICE_NAME_PREFIX;
              const id = this.bleDevice.id || 'BLE-BMS';
              return this.discoverServicesAndSubscribe(server, { name, id });
            })
            .catch(() => {
              batteryStateService.setConnectionState('DISCONNECTED');
            });
        }
      }, delay);
    } else {
      batteryStateService.setConnectionState('DISCONNECTED');
    }
  }

  /**
   * Start Virtual Battery Simulator BLE GATT Peripheral (1-Click Local Dev Simulator)
   * Generates exact normalized JSON telemetry notifications matching the hardware BLE contract.
   */
  public startVirtualGattPeripheral(): void {
    this.stopVirtualGattPeripheral();
    this.isVirtualGattActive = true;
    this.isManualDisconnect = false;

    const deviceName = `${BLE_CONFIG.DEVICE_NAME_PREFIX} (Simulated Peripheral)`;
    const deviceId = 'SIM-BLE-GATT-PERIPHERAL-96S';

    batteryStateService.setConnectionState('CONNECTED', { name: deviceName, id: deviceId, rssi: -55 });

    let step = 0;
    this.virtualTimer = setInterval(() => {
      if (!this.isVirtualGattActive) return;
      step++;
      this.sequenceCounter++;

      const volt = +(350.0 + Math.sin(step * 0.15) * 4.5).toFixed(1);
      const curr = +(120.0 + Math.cos(step * 0.15) * 8.5).toFixed(1);
      const temp = +(34.0 + Math.sin(step * 0.08) * 3.2).toFixed(1);
      const soc = Math.max(10, Math.min(100, Math.round(84 - step * 0.04)));
      const powerKw = +((volt * curr) / 1000.0).toFixed(1);
      const isThermalSpike = temp > 44.0;

      const mockPayload: RawBleTelemetryPayload = {
        protocolVersion: BLE_CONFIG.PROTOCOL_VERSION,
        messageType: 'TELEMETRY',
        sequenceNumber: this.sequenceCounter,
        timestamp: Date.now(),
        pack: {
          soc,
          soh: 96.4,
          voltage: volt,
          current: curr,
          power: powerKw,
          temperature: temp,
          maxTemperature: +(temp + 1.2).toFixed(1),
          minTemperature: +(temp - 1.1).toFixed(1),
          internalResistance: 1.2,
          cycleCount: 428,
          estimatedRange: Math.round(soc * 4.1),
          risk: isThermalSpike ? 68 : Math.round(2 + Math.abs(Math.sin(step * 0.1) * 8)),
          safetyState: isThermalSpike ? 'WARNING' : 'HEALTHY',
        },
        environment: {
          ambientTemperature: 29.0,
        },
        charging: {
          active: false,
          current: 0,
          power: 0,
          temperature: temp,
          durationSeconds: 0,
        },
        cells: Array.from({ length: 8 }, (_, idx) => {
          const isAbnormalCell = isThermalSpike && (idx === 2 || idx === 6);
          return {
            id: idx + 1,
            voltage: +(3.72 + (Math.random() - 0.5) * 0.02).toFixed(2),
            temperature: isAbnormalCell ? +(temp + 12.4).toFixed(1) : +(temp + (Math.random() - 0.5) * 0.6).toFixed(1),
            deviation: isAbnormalCell ? 0.28 : 0.01,
            risk: isAbnormalCell ? 84 : 2,
            status: isAbnormalCell ? 'WARNING' : 'HEALTHY',
          };
        }),
      };

      batteryStateService.processLiveBleTelemetry(mockPayload, { name: deviceName, id: deviceId, rssi: -55 });
    }, 1000);
  }

  /**
   * Stop Virtual Peripheral Simulation
   */
  public stopVirtualGattPeripheral(): void {
    if (this.virtualTimer) {
      clearInterval(this.virtualTimer);
      this.virtualTimer = null;
    }
    this.isVirtualGattActive = false;
  }

  /**
   * Disconnect BLE GATT Server
   */
  public disconnect(): void {
    this.isManualDisconnect = true;
    this.stopVirtualGattPeripheral();

    if (this.telemetryCharacteristic) {
      try {
        this.telemetryCharacteristic.stopNotifications().catch(() => {});
      } catch (e) {}
      this.telemetryCharacteristic = null;
    }

    if (this.gattServer && this.gattServer.connected) {
      try {
        this.gattServer.disconnect();
      } catch (e) {}
    }

    this.gattServer = null;
    this.bleDevice = null;
    batteryStateService.setConnectionState('DISCONNECTED');
  }
}

export const bluetoothService = new BluetoothService();
export default bluetoothService;
