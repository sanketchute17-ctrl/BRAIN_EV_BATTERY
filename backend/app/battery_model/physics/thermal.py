"""
thermal.py — Physics-Based Thermal & Heat Transfer Model
=========================================================
Battery Digital Twin | Physics Layer

Implements heat balance equations for battery cells:
  1. Heat Generation (Joule Heating):
     Q_gen = I² * (R_internal + R_busbar)

  2. Fourier Thermal Conduction Between Neighboring Cells:
     Q_cond = (k * A / d) * (T_neighbor - T_cell)

  3. Energy Balance & Temperature Change:
     m * Cp * (dT/dt) = Q_gen - Q_cool + Q_conduction
"""

import os
import json
from cooling import compute_btms_cooling

def load_config() -> dict:
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'battery_parameters.json')
    if not os.path.exists(config_path):
        config_path = os.path.join(os.path.dirname(__file__), '..', 'parameters', 'thermal_parameters.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

CONFIG = load_config()

def _get_val(obj, default):
    if isinstance(obj, dict) and 'value' in obj:
        return obj['value']
    return obj if obj is not None else default

therm_cfg = CONFIG.get('thermal', CONFIG)
M_CELL    = _get_val(therm_cfg.get('cell_mass_kg'), 0.045)
CP_CELL   = _get_val(therm_cfg.get('cell_specific_heat_J_per_kgK'), 900.0)
M_CP      = M_CELL * CP_CELL  # Thermal mass (J/K)

K_COND    = _get_val(therm_cfg.get('thermal_conductivity_W_per_mK'), 1.5)
A_AREA    = _get_val(therm_cfg.get('cell_contact_area_m2'), 0.0012)
D_SPACING = _get_val(therm_cfg.get('cell_spacing_m'), 0.020)

def compute_joule_heat(current_A: float, resistance_ohm: float, busbar_resistance_ohm: float = 0.0) -> float:
    """
    Joule Heat Generation:
    Q_gen = I² * (R_internal + R_busbar)
    """
    total_r = max(0.0, resistance_ohm + busbar_resistance_ohm)
    return (current_A ** 2) * total_r

def compute_fourier_conduction(T_source: float, T_target: float) -> float:
    """
    Fourier's Law of Conduction:
    Q = (k * A / d) * (T_source - T_target)
    """
    conductance = K_COND * A_AREA / D_SPACING
    return conductance * (T_source - T_target)

def compute_cell_conduction_net(cell_index: int, cell_temperatures: list[float]) -> float:
    """
    Net Fourier heat flow into cell i from left and right neighbors:
    Q_net_i = Q(cell[i-1] -> cell[i]) + Q(cell[i+1] -> cell[i])
    """
    n = len(cell_temperatures)
    q_net = 0.0
    # Left neighbor
    if cell_index > 0:
        q_net += compute_fourier_conduction(cell_temperatures[cell_index - 1], cell_temperatures[cell_index])
    # Right neighbor
    if cell_index < n - 1:
        q_net += compute_fourier_conduction(cell_temperatures[cell_index + 1], cell_temperatures[cell_index])
    return q_net

def compute_temperature_step(
    temperature_C: float,
    current_A: float,
    resistance_ohm: float,
    flow_rate_LPM: float,
    q_conduction_W: float,
    dt_s: float = 0.2,
    busbar_resistance_ohm: float = 0.0,
    cooling_efficiency: float = 1.0
) -> tuple[float, dict]:
    """
    Compute cell temperature update over dt_s seconds:
    m * Cp * (dT/dt) = Q_gen - Q_cool + Q_conduction
    """
    q_gen = compute_joule_heat(current_A, resistance_ohm, busbar_resistance_ohm)
    q_cool = compute_btms_cooling(temperature_C, flow_rate_LPM, cooling_efficiency)
    q_net = q_gen - q_cool + q_conduction_W

    dT_dt = q_net / M_CP
    new_temp = temperature_C + dT_dt * dt_s
    new_temp = max(20.0, min(200.0, new_temp))

    return new_temp, {
        'Q_gen_W': round(q_gen, 4),
        'Q_cool_W': round(q_cool, 4),
        'Q_cond_W': round(q_conduction_W, 4),
        'Q_net_W': round(q_net, 4),
        'dT_dt': round(dT_dt, 6),
        'new_temp_C': round(new_temp, 4)
    }
