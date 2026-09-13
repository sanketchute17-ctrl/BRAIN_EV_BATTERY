"""
virtual_sensor.py — Virtual Sensors Between Digital Twin Core & BMS Controller
=============================================================================
Battery Digital Twin | BMS Layer

Adds realistic measurement noise and sensor error to physical readings:
  - Voltage tap: ±2 mV noise
  - Thermistor: ±0.5 °C noise (or stuck value during sensor failure)
  - Current shunt: ±0.1 A noise
  - Coolant flow sensor: ±0.3 LPM noise
"""

import random

_rng = random.Random(42)

def set_seed(seed: int = 42):
    global _rng
    _rng = random.Random(seed)

VOLTAGE_NOISE_V  = 0.002
TEMP_NOISE_C     = 0.5
CURRENT_NOISE_A  = 0.1
FLOW_NOISE_LPM   = 0.3

def read_voltage_sensor(true_v: float) -> float:
    noise = _rng.gauss(0, VOLTAGE_NOISE_V)
    return round(true_v + noise, 4)

def read_temperature_sensor(true_t: float, is_faulted: bool = False) -> float:
    if is_faulted:
        return 35.0  # Corrupted stuck thermistor value
    noise = _rng.gauss(0, TEMP_NOISE_C)
    return round(true_t + noise, 2)

def read_current_sensor(true_i: float) -> float:
    noise = _rng.gauss(0, CURRENT_NOISE_A)
    return round(true_i + noise, 3)

def read_flow_sensor(true_flow: float) -> float:
    if true_flow <= 0: return 0.0
    noise = _rng.gauss(0, FLOW_NOISE_LPM)
    return round(max(0.0, true_flow + noise), 2)

def read_cell_sensors(cell_dict: dict) -> dict:
    true_v = cell_dict.get('voltage', 3.6)
    true_t = cell_dict.get('temperature', 28.0)
    true_i = cell_dict.get('current', 0.0)
    is_temp_fault = cell_dict.get('fault_type') == 'sensor_failure'

    return {
        'id': cell_dict.get('id', 1),
        'sensed_voltage_V': read_voltage_sensor(true_v),
        'sensed_temp_C': read_temperature_sensor(true_t, is_temp_fault),
        'sensed_current_A': read_current_sensor(true_i),
        'soc': cell_dict.get('soc', 75.0),
        'fault_type': cell_dict.get('fault_type', 'none'),
        'fault_status': cell_dict.get('fault_status', 'NORMAL')
    }
