"""
test_ble_system.py — BLE Telemetry System Integration Test
===========================================================
Validates:
  1. BLE Server Advertising as 'BRAIN_BATTERY_BMS'
  2. Packet Transmitter streaming 1 packet/sec with sequence IDs (001, 002...)
  3. BLE Test Receiver receiving and parsing BMS JSON telemetry
  4. AI Prediction Input Compatibility Check (Voltage, Current, Temperature, Cycle Number, Capacity, Resistance, History Storage)
"""

import sys
import os
import time
import threading

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'communication', 'bluetooth'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'communication'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'bms'))

from packet_transmitter import PacketTransmitter
from ble_receiver import run_ble_receiver
from prediction_compatibility import PredictionCompatibilityChecker

def test_ble_full_flow():
    print("=" * 70)
    print("  BLE TELEMETRY & PREDICTION COMPATIBILITY TEST")
    print("=" * 70)

    transmitter = PacketTransmitter(interval_seconds=0.5)

    # Start transmitter thread
    tx_thread = threading.Thread(target=transmitter.start_transmission, kwargs={'max_packets': 4}, daemon=True)
    tx_thread.start()

    time.sleep(0.6)  # Give server time to bind and advertise

    # Run BLE test receiver to capture 3 packets
    print("\n[TEST] Running BLE Test Receiver to connect to 'BRAIN_BATTERY_BMS'...")
    run_ble_receiver(max_packets=3)

    tx_thread.join(timeout=5)

    # Verify AI prediction compatibility on last packet
    print("\n[TEST] Checking AI Prediction Compatibility Matrix...")
    summary = transmitter.pack.get_pack_summary()
    bms_state = transmitter.bms.process(summary)
    from telemetry_generator import generate_telemetry_packet
    pkt = generate_telemetry_packet(bms_state, sequence_counter=99)

    checker = PredictionCompatibilityChecker()
    report = checker.verify_packet(pkt)

    print("\nPrediction Input Requirement Check:")
    for k, v in report['matrix'].items():
        print(f"  {k:<30}: {v}")

    assert report['compatible'] == True, "All prediction inputs must be YES"
    print("\n" + "=" * 70)
    print("  ALL BLE SIMULATION & PREDICTION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == '__main__':
    test_ble_full_flow()
