"""
heat_transfer.py — Fourier Thermal Conduction & BTMS Cooling Heat Removal
=========================================================================
Battery Digital Twin | Physics Layer

Implements:
  Q_conduction = (k * A / d) * (T_source - T_sink)   [Fourier's Law — neighbor cells]
  Q_removed    = m_dot * Cp * (T_cell - T_inlet)     [BTMS convective cooling]

All values from thermal_parameters.json and cooling_parameters.json (with metadata support).
"""

import json
import os
import sys

# Ensure parameter loader import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'parameters'))
from param_loader import get_param_val, load_parameter_dict

# ── Load Parameters ───────────────────────────────────────────────────────────
THERM = load_parameter_dict('thermal_parameters.json')
COOL  = load_parameter_dict('cooling_parameters.json')

# Fourier conduction geometry
K_CONDUCTIVITY = get_param_val(THERM['thermal_conductivity_W_per_mK'])   # W/(m·K)
A_CONTACT      = get_param_val(THERM['cell_contact_area_m2'])            # m²
D_SPACING      = get_param_val(THERM['cell_spacing_m'])                  # m

# BTMS cooling properties
CP_COOLANT     = get_param_val(COOL['coolant_specific_heat_J_per_kgK'])  # J/(kg·K)
DENSITY        = get_param_val(COOL['coolant_density_kg_per_m3'])         # kg/m³
T_INLET        = get_param_val(COOL['coolant_inlet_temperature_C'])       # °C
FAIL_THRESHOLD = get_param_val(COOL['cooling_failure_threshold_LPM'])     # LPM


def compute_fourier_conduction(T_source: float, T_sink: float) -> float:
    """
    Compute heat flow rate from a hot cell to an adjacent cooler cell
    using Fourier's Law of Thermal Conduction.

    Q_cond = (k * A / d) * (T_source - T_sink)

    Heat automatically moves from hotter components toward cooler components.

    Args:
        T_source: Temperature of the source cell (°C)
        T_sink:   Temperature of the sink cell (°C)

    Returns:
        Q_cond in Watts. Positive = net heat flow into sink.
    """
    delta_T = T_source - T_sink
    conductance = K_CONDUCTIVITY * A_CONTACT / D_SPACING   # W/K
    return conductance * delta_T


def compute_lateral_conduction_array(temperatures: list[float]) -> list[float]:
    """
    Compute net heat conducted from/to each cell in an array.

    For cell i:
        Q_net_i = Q_from_left + Q_from_right
        Q_from_left  = fourier(T[i-1], T[i])   (heat INTO cell i from left)
        Q_from_right = fourier(T[i+1], T[i])   (heat INTO cell i from right)

    Args:
        temperatures: List of cell temperatures [T0, T1, ..., TN] (°C)

    Returns:
        List of net heat flow into each cell (W). Positive = net heat gain.
    """
    n = len(temperatures)
    net_conducted = [0.0] * n

    for i in range(n):
        # Heat from left neighbour into cell i
        if i > 0:
            net_conducted[i] += compute_fourier_conduction(temperatures[i-1], temperatures[i])
        # Heat from right neighbour into cell i
        if i < n - 1:
            net_conducted[i] += compute_fourier_conduction(temperatures[i+1], temperatures[i])

    return net_conducted


def compute_btms_cooling(T_cell: float, flow_rate_LPM: float, cooling_efficiency: float = 1.0) -> float:
    """
    Compute heat removed from a cell surface by BTMS liquid coolant.

    Q_removed = m_dot * Cp * (T_cell - T_inlet) * cooling_efficiency

    where:
        m_dot = flow_rate_LPM / 60000 * density   [kg/s]

    Args:
        T_cell:             Cell surface temperature (°C)
        flow_rate_LPM:      Coolant volumetric flow rate (litres/minute)
        cooling_efficiency: Multiplier for degraded cooling efficiency (0.0 to 1.0)

    Returns:
        Q_removed in Watts. Zero if cooling pump is off (flow_rate_LPM <= FAIL_THRESHOLD).
    """
    if flow_rate_LPM <= FAIL_THRESHOLD:
        return 0.0  # Cooling failure — zero heat extraction

    # Convert LPM → m³/s → kg/s
    flow_m3_per_s = flow_rate_LPM / 60000.0
    m_dot_kg_per_s = flow_m3_per_s * DENSITY

    delta_T = T_cell - T_INLET
    if delta_T <= 0:
        return 0.0   # Cell cooler than coolant inlet — no heat removal

    q_removed = m_dot_kg_per_s * CP_COOLANT * delta_T * max(0.0, min(1.0, cooling_efficiency))
    return max(0.0, q_removed)


def compute_cooling_for_array(temperatures: list[float], flow_rate_LPM: float, cooling_efficiency: float = 1.0) -> list[float]:
    """
    Compute BTMS heat removal for each cell in an array.

    Args:
        temperatures:       List of cell temperatures (°C)
        flow_rate_LPM:      Coolant flow rate (LPM), shared across all cells.
        cooling_efficiency: Thermal efficiency multiplier (e.g. 0.5 for degraded pump).

    Returns:
        List of Q_removed values per cell (W).
    """
    num_cells = len(temperatures)
    if num_cells == 0:
        return []

    return [
        compute_btms_cooling(T, flow_rate_LPM, cooling_efficiency) / num_cells
        for T in temperatures
    ]


# ── Standalone Test ───────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 60)
    print("  Heat Transfer Model — Standalone Test")
    print("=" * 60)

    # Simulate a temperature gradient: Cell 5 has a fault, it's very hot
    test_temps = [31.0, 32.0, 33.0, 34.0, 58.0, 42.0, 37.0, 35.0]
    print(f"\nCell Temperatures (°C): {test_temps}")

    print(f"\nFourier Lateral Conduction Results (W per cell):")
    conduction = compute_lateral_conduction_array(test_temps)
    for i, q in enumerate(conduction):
        direction = "← GAINING HEAT" if q > 0 else "→ LOSING HEAT" if q < 0 else "  stable"
        print(f"  Cell {i+1}: Q_cond = {q:+.4f} W  {direction}")

    print(f"\nBTMS Cooling Removal (flow = 8.5 LPM):")
    cooling = compute_cooling_for_array(test_temps, 8.5)
    for i, q in enumerate(cooling):
        print(f"  Cell {i+1}: Q_removed = {q:.4f} W")

    print(f"\nBTMS Cooling with Pump FAILED (flow = 0.0 LPM):")
    no_cooling = compute_cooling_for_array(test_temps, 0.0)
    print(f"  All Q_removed = {no_cooling[0]:.4f} W (zero — heat trapped)")
    print()
