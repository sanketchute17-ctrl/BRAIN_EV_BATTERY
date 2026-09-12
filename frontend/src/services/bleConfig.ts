/**
 * Centralized BRAIN BLE Configuration
 * Defines target BLE GATT Peripheral UUIDs, Service IDs, and Connection Settings
 */

export const BLE_CONFIG = {
  // Target Device Name Filter Prefix for GATT Discovery
  DEVICE_NAME_PREFIX: 'BRAIN-VIRTUAL-BMS',
  
  // GATT Service UUIDs
  SERVICE_UUID: '0000ffe0-0000-1000-8000-00805f9b34fb',
  BATTERY_SERVICE_UUID: '0000180f-0000-1000-8000-00805f9b34fb',
  DEVICE_INFO_SERVICE_UUID: '0000180a-0000-1000-8000-00805f9b34fb',

  // GATT Characteristic UUIDs
  TELEMETRY_CHAR_UUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
  STATUS_CHAR_UUID: '0000ffe2-0000-1000-8000-00805f9b34fb',
  COMMAND_CHAR_UUID: '0000ffe3-0000-1000-8000-00805f9b34fb',

  // Expected Protocol Version
  PROTOCOL_VERSION: 1,

  // Reconnection Settings
  MAX_RECONNECT_RETRIES: 3,
  INITIAL_RECONNECT_DELAY_MS: 2000,
  MAX_RECONNECT_DELAY_MS: 8000,
};

export default BLE_CONFIG;
