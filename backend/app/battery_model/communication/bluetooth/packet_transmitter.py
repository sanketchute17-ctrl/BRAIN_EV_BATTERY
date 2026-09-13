"""
packet_transmitter.py — Continuous BLE BMS Telemetry Packet Transmitter
=========================================================================
Battery Digital Twin | Communication Layer

Continuous transmission loop:
  Digital Twin Engine
         ↓
    Virtual BMS
         ↓
  JSON Telemetry Packet
         ↓
  BLE Encoder / Packet Transmitter
         ↓
  BLE Server Broadcast (BRAIN_BATTERY_BMS)

Transmits 1 packet per second (configurable interval).
Maintains sequential packet IDs (001, 002, 003...) and timestamps.
"""

import sys
import os
import time
import threading

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'battery')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'bms')))

from pack import BatteryPack
from controller import VirtualBMSController
from telemetry_generator import generate_telemetry_packet
from ble_server import BLEServer

class PacketTransmitter:
    """Continuous BLE Packet Transmitter running simulation & streaming telemetry."""

    def __init__(self, interval_seconds: float = 1.0, pack: BatteryPack = None):
        self.interval_s = interval_seconds
        self.pack = pack if pack else BatteryPack(pack_id="BRAIN001", cycle_count=350)
        self.bms = VirtualBMSController(battery_id="BRAIN001")
        self.ble_server = BLEServer()
        self.sequence_counter = 0
        self.is_running = False
        self.load_current_A = 15.0  # Discharging -15A default

    def start_transmission(self, max_packets: int = None):
        """Start streaming telemetry packets continuously."""
        self.ble_server.start()
        self.is_running = True

        print(f"[TRANSMITTER] Starting BLE packet transmission stream (Interval: {self.interval_s}s)...")
        packet_count = 0

        while self.is_running:
            if max_packets and packet_count >= max_packets:
                break

            self.sequence_counter += 1
            # Step Digital Twin physics
            summary = self.pack.step(load_current_A=self.load_current_A, dt_s=self.interval_s)
            bms_state = self.bms.process(summary, load_current_A=self.load_current_A)

            # Generate standard telemetry packet
            pkt = generate_telemetry_packet(bms_state, sequence_counter=self.sequence_counter)

            # Transmit via BLE Server
            res = self.ble_server.broadcast(pkt)

            print(f"  BLE TX #{pkt['sequence_id']} | Time: {pkt['timestamp']} | "
                  f"V: {pkt['pack']['voltage']}V | I: {pkt['pack']['current']}A | "
                  f"T: {pkt['thermal']['max_temperature']}°C | Fault: {pkt['fault']['status']} | Receivers: {res.get('receivers_count', 0)}")

            packet_count += 1
            time.sleep(self.interval_s)

        print("[TRANSMITTER] Stopped transmission stream.")
        self.ble_server.stop()

    def stop(self):
        self.is_running = False

if __name__ == '__main__':
    transmitter = PacketTransmitter(interval_seconds=1.0)
    try:
        transmitter.start_transmission(max_packets=5)
    except KeyboardInterrupt:
        transmitter.stop()
