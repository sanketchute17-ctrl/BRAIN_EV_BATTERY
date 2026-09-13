"""
electrical.py — Physics-Based Battery Electrical Model
======================================================
Battery Digital Twin | Physics Layer

Implements core physical electrical equations:
  1. Terminal Voltage:
     V_terminal = OCV(SOC) - I * R_internal
  2. Open Circuit Voltage:
     OCV(SOC) = a + b * (SOC / 100)
  3. State of Charge Update (Coulomb Counting):
     SOC(t) = SOC(t-1) - (I * dt / Q) * 100%

All calculations follow physical relationships with zero artificial/random numbers.
"""

import os
import json

def load_config() -> dict:
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'battery_parameters.json')
    if not os.path.exists(config_path):
        config_path = os.path.join(os.path.dirname(__file__), '..', 'parameters', 'battery_parameters.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

CONFIG = load_config()

def _get_val(obj, default):
    if isinstance(obj, dict) and 'value' in obj:
        return obj['value']
    return obj if obj is not None else default

OCV_A = _get_val(CONFIG.get('ocv_soc_model', {}).get('a_intercept_V'), 3.20)
OCV_B = _get_val(CONFIG.get('ocv_soc_model', {}).get('b_slope_V'), 0.95)
MAX_V = _get_val(CONFIG.get('cell_max_voltage_V'), 4.20)
MIN_V = _get_val(CONFIG.get('cell_min_voltage_V'), 2.50)

def compute_ocv(soc_percent: float) -> float:
    """
    Calculate Open Circuit Voltage (OCV) from SOC.
    OCV(SOC) = a + b * (SOC / 100)
    """
    soc_frac = max(0.0, min(1.0, soc_percent / 100.0))
    return OCV_A + OCV_B * soc_frac

def compute_terminal_voltage(soc_percent: float, current_A: float, resistance_ohm: float, busbar_resistance_ohm: float = 0.0) -> float:
    """
    Compute Cell Terminal Voltage:
    V_terminal = OCV(SOC) - I * (R_internal + R_busbar)

    Convention:
      current_A > 0 => Discharge (current flows out, voltage sags)
      current_A < 0 => Charge (current flows in, voltage rises)
    """
    ocv = compute_ocv(soc_percent)
    total_r = max(0.0, resistance_ohm + busbar_resistance_ohm)
    v_term = ocv - (current_A * total_r)
    return max(MIN_V, min(MAX_V, v_term))

def compute_soc_step(soc_percent: float, current_A: float, capacity_Ah: float, dt_s: float) -> float:
    """
    Update State of Charge (SOC):
    SOC(t) = SOC(t-1) - (I * dt / (3600 * Q)) * 100%
    """
    if capacity_Ah <= 0:
        return soc_percent
    d_soc = -(current_A * dt_s) / (3600.0 * capacity_Ah) * 100.0
    return max(0.0, min(100.0, soc_percent + d_soc))

def compute_power(current_A: float, voltage_V: float) -> float:
    """Compute instantaneous power: P = V * I [W]"""
    return voltage_V * current_A
