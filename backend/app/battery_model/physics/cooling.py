"""
cooling.py — Physics-Based BTMS Cooling System Model
===================================================
Battery Digital Twin | Physics Layer

Implements BTMS convective heat removal equation:
  Q_cool = min( h * A * (T_cell - T_inlet), m_dot_cell * Cp * (T_cell - T_inlet) ) * efficiency

Where:
  - h * A ≈ 1.2 W/K (cell-to-cold-plate thermal conductance per cell)
  - m_dot_cell = (flow_rate_LPM / (8 * 60000)) * density   [kg/s per cell]
"""

import os
import json

def load_config() -> dict:
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'battery_parameters.json')
    if not os.path.exists(config_path):
        config_path = os.path.join(os.path.dirname(__file__), '..', 'parameters', 'cooling_parameters.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

CONFIG = load_config()

def _get_val(obj, default):
    if isinstance(obj, dict) and 'value' in obj:
        return obj['value']
    return obj if obj is not None else default

cooling_cfg = CONFIG.get('cooling', CONFIG)
CP_COOLANT = _get_val(cooling_cfg.get('coolant_specific_heat_J_per_kgK'), 4184.0)
DENSITY    = _get_val(cooling_cfg.get('coolant_density_kg_per_m3'), 1000.0)
T_INLET    = _get_val(cooling_cfg.get('coolant_inlet_temperature_C'), 25.0)
FAIL_THRESH= _get_val(cooling_cfg.get('cooling_failure_threshold_LPM'), 0.5)

H_A_CONDUCTANCE = 1.2  # W/K — thermal conductance from cell surface to coolant cold plate

def compute_btms_cooling(temperature_C: float, flow_rate_LPM: float, cooling_efficiency: float = 1.0, num_cells: int = 8) -> float:
    """
    Compute heat removed from cell by BTMS coolant (Watts).
    """
    if flow_rate_LPM < FAIL_THRESH or cooling_efficiency <= 0.0:
        return 0.0

    delta_T = temperature_C - T_INLET
    if delta_T <= 0.0:
        return 0.0

    # Flow per cell (LPM / num_cells)
    cell_flow_LPM = flow_rate_LPM / num_cells
    cell_m_dot = (cell_flow_LPM / 60000.0) * DENSITY
    q_max_coolant = cell_m_dot * CP_COOLANT * delta_T

    q_surface_transfer = H_A_CONDUCTANCE * delta_T
    q_cool = min(q_surface_transfer, q_max_coolant) * max(0.0, min(1.0, cooling_efficiency))

    return max(0.0, q_cool)
