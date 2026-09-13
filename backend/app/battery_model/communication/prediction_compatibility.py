"""
prediction_compatibility.py — AI Prediction Input Verification & History Storage
===================================================================================
Battery Digital Twin | Communication & Model Compatibility Layer

Verifies presence of all 7 required inputs for future AI prediction models:
  1. Voltage
  2. Current
  3. Temperature
  4. Cycle Number
  5. Capacity
  6. Resistance
  7. History storage capability (writes to telemetry_history.jsonl)
"""

import os
import json
import time

HISTORY_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'telemetry_history.jsonl'))

class PredictionCompatibilityChecker:
    """Verifies battery telemetry packet completeness for future AI model training."""

    REQUIRED_PREDICTION_FIELDS = {
        'voltage': ['pack.voltage', 'cells[].voltage', 'pack_voltage'],
        'current': ['pack.current', 'pack_current'],
        'temperature': ['thermal.max_temperature', 'cells[].temperature', 'max_temperature'],
        'cycle_number': ['pack.cycle_number', 'cycle_number'],
        'capacity': ['aging.capacity'],
        'resistance': ['aging.internal_resistance', 'cells[].resistance'],
    }

    def __init__(self, history_file: str = HISTORY_FILE):
        self.history_file = history_file

    def verify_packet(self, telemetry_packet: dict) -> dict:
        """Validate packet contains all required AI prediction parameters."""
        results = {}

        # 1. Voltage check
        has_v = 'pack' in telemetry_packet and 'voltage' in telemetry_packet['pack']
        results['Voltage'] = 'YES' if has_v else 'NO'

        # 2. Current check
        has_i = 'pack' in telemetry_packet and 'current' in telemetry_packet['pack']
        results['Current'] = 'YES' if has_i else 'NO'

        # 3. Temp check
        has_t = 'thermal' in telemetry_packet and 'max_temperature' in telemetry_packet['thermal']
        results['Temperature'] = 'YES' if has_t else 'NO'

        # 4. Cycle Number check
        has_c = 'pack' in telemetry_packet and 'cycle_number' in telemetry_packet['pack']
        results['Cycle Number'] = 'YES' if has_c else 'NO'

        # 5. Capacity check
        has_q = 'aging' in telemetry_packet and 'capacity' in telemetry_packet['aging']
        results['Capacity'] = 'YES' if has_q else 'NO'

        # 6. Resistance check
        has_r = 'aging' in telemetry_packet and 'internal_resistance' in telemetry_packet['aging']
        results['Resistance'] = 'YES' if has_r else 'NO'

        # 7. History storage capability
        history_ok = self.log_to_history(telemetry_packet)
        results['History storage capability'] = 'YES' if history_ok else 'NO'

        all_passed = all(v == 'YES' for v in results.values())

        return {
            'compatible': all_passed,
            'matrix': results,
            'history_file': self.history_file
        }

    def log_to_history(self, telemetry_packet: dict) -> bool:
        """Append telemetry packet to historical telemetry_history.jsonl file."""
        try:
            with open(self.history_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(telemetry_packet) + "\n")
            return True
        except Exception as e:
            print(f"[PREDICTION_CHECK] History log error: {e}")
            return False

if __name__ == '__main__':
    mock_packet = {
        "battery_id": "BRAIN001",
        "timestamp": int(time.time() * 1000),
        "sequence_id": "001",
        "pack": {"voltage": 48.5, "current": 15.2, "power": 737.2, "cycle_number": 350},
        "cells": [{"cell_id": 1, "voltage": 3.82, "temperature": 32.0, "soc": 85.0, "resistance": 0.025}],
        "thermal": {"max_temperature": 35.0, "average_temperature": 32.0, "coolant_flow": 8.5},
        "aging": {"capacity": 1.85, "soh": 92.0, "internal_resistance": 0.035},
        "fault": {"status": "NORMAL", "type": "NONE"}
    }

    checker = PredictionCompatibilityChecker()
    report = checker.verify_packet(mock_packet)

    print("=" * 60)
    print("  PREDICTION COMPATIBILITY CHECK REPORT")
    print("=" * 60)
    for req, avail in report['matrix'].items():
        print(f"  {req:<30}: {avail}")
    print("-" * 60)
    print(f"  Overall AI Prediction Compatibility : {'PASSED (READY)' if report['compatible'] else 'FAILED'}")
    print(f"  History File Location              : {report['history_file']}")
    print("=" * 60)
