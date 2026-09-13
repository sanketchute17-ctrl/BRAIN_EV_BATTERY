"""
telemetry.py — Standardized BMS Telemetry JSON Packet Generator
================================================================
Battery Digital Twin | BMS Layer

Generates standardized BMS telemetry JSON packet (Section 6 Specification):
  {
    "battery_id": "BRAIN001",
    "timestamp": 123456789,
    "sequence_id": "001",
    "pack": {
      "voltage": 48.5,
      "current": 15.2,
      "power": 737,
      "cycle_number": 350
    },
    "cells": [
      {
        "cell_id": 1,
        "voltage": 3.82,
        "temperature": 32,
        "soc": 85,
        "resistance": 0.025
      }
    ],
    "thermal": {
      "max_temperature": 35,
      "average_temperature": 32,
      "coolant_flow": 8.5
    },
    "aging": {
      "capacity": 1.85,
      "soh": 92,
      "internal_resistance": 0.035
    },
    "fault": {
      "status": "NORMAL",
      "type": "NONE"
    }
  }
"""

import json
import time

def generate_bms_telemetry(bms_state: dict, sequence_counter: int = 1) -> dict:
    """Generate standardized telemetry JSON dict matching exact Section 6 schema."""
    current_time_ms = int(time.time() * 1000)
    seq_str = f"{sequence_counter:03d}"

    cells_payload = []
    for c in bms_state.get('sensed_cells', []):
        c_id = c.get('id', 1)
        if isinstance(c_id, str) and '-' in c_id:
            c_id = int(c_id.split('-')[-1])
        else:
            c_id = int(c_id)

        cells_payload.append({
            'cell_id': c_id,
            'voltage': round(c.get('sensed_voltage_V', 3.6), 2),
            'temperature': round(c.get('sensed_temp_C', 28.0), 1),
            'soc': round(c.get('soc', 75.0), 1),
            'resistance': round(c.get('internal_resistance', c.get('effective_resistance_ohm', 0.020)), 4)
        })

    pack_v = round(bms_state.get('pack_voltage', 28.8), 1)
    pack_i = round(bms_state.get('pack_current', 0.0), 1)
    power_w = round(abs(pack_v * pack_i), 1)

    active_faults = bms_state.get('active_faults', [])
    fault_type_str = active_faults[0] if active_faults else "NONE"
    fault_status_str = bms_state.get('fault_status', 'NORMAL')

    packet = {
        'battery_id': bms_state.get('battery_id', 'BRAIN001'),
        'timestamp': current_time_ms,
        'sequence_id': seq_str,

        'pack': {
            'voltage': pack_v,
            'current': pack_i,
            'power': power_w,
            'cycle_number': bms_state.get('cycle_number', 100)
        },

        'cells': cells_payload,

        'thermal': {
            'max_temperature': round(bms_state.get('max_temperature', 28.0), 1),
            'average_temperature': round(bms_state.get('avg_temperature', bms_state.get('max_temperature', 28.0)), 1),
            'coolant_flow': round(bms_state.get('cooling_flow_LPM', 8.5), 1)
        },

        'aging': {
            'capacity': round(bms_state.get('capacity_Ah', 2.45), 2),
            'soh': round(bms_state.get('soh_percent', 98.0), 1),
            'internal_resistance': round(bms_state.get('internal_resistance_ohm', 0.021), 4)
        },

        'fault': {
            'status': fault_status_str,
            'type': fault_type_str
        },

        # Flat root aliases for legacy compatibility
        'time': current_time_ms,
        'pack_voltage': pack_v,
        'pack_current': pack_i,
        'max_temperature': round(bms_state.get('max_temperature', 28.0), 1),
        'cycle_number': bms_state.get('cycle_number', 100),
        'fault_status': fault_status_str
    }

    return packet

def telemetry_to_json(telemetry_packet: dict, indent: int = None) -> str:
    return json.dumps(telemetry_packet, indent=indent)
