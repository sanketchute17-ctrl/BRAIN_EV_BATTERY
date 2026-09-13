"""
aging.py — Physics-Based Battery Cycle Degradation & Aging Model
================================================================
Battery Digital Twin | Physics Layer

Implements physics-based aging equations:
  1. Resistance Increase:
     R(n) = R0 * (1 + alpha * n / n_max)

  2. Capacity Fade:
     Q(n) = Q0 * (1 - beta * n / n_max)

  3. State of Health (SOH):
     SOH(n) = 100 * Q(n) / Q0
"""

import os
import json

def load_config() -> dict:
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'battery_parameters.json')
    if not os.path.exists(config_path):
        config_path = os.path.join(os.path.dirname(__file__), '..', 'parameters', 'aging_parameters.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

CONFIG = load_config()

def _get_val(obj, default):
    if isinstance(obj, dict) and 'value' in obj:
        return obj['value']
    return obj if obj is not None else default

aging_cfg = CONFIG.get('aging', CONFIG)
N_MAX = _get_val(aging_cfg.get('max_cycle_count'), 1500)
R0    = _get_val(CONFIG.get('cell_internal_resistance_ohm'), 0.020)
ALPHA = _get_val(aging_cfg.get('alpha'), 1.0)
Q0    = _get_val(CONFIG.get('cell_capacity_Ah'), 2.5)
BETA  = _get_val(aging_cfg.get('beta'), 0.20)

def compute_aged_resistance(cycle_count: int) -> float:
    """
    R(n) = R0 * (1 + alpha * n / n_max)
    """
    n = max(0, min(cycle_count, N_MAX))
    return R0 * (1.0 + ALPHA * (n / N_MAX))

def compute_aged_capacity(cycle_count: int) -> float:
    """
    Q(n) = Q0 * (1 - beta * n / n_max)
    """
    n = max(0, min(cycle_count, N_MAX))
    return Q0 * (1.0 - BETA * (n / N_MAX))

def compute_soh(cycle_count: int) -> float:
    """
    SOH(n) = 100 * Q(n) / Q0
    """
    q_aged = compute_aged_capacity(cycle_count)
    return round(100.0 * (q_aged / Q0), 2)
