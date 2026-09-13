"""
cell.py — Individual Lithium-Ion Battery Cell Representation
===========================================================
Battery Digital Twin | Battery Architecture Layer

Each cell maintains its physical state:
  - Cell ID
  - Voltage (V)
  - Current (A)
  - Temperature (°C)
  - SOC (%)
  - Capacity (Ah)
  - SOH (%)
  - Internal Resistance (Ω)
  - Fault Status (NORMAL / FAULT / DEGRADED)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'physics'))
from electrical import compute_terminal_voltage, compute_soc_step
from aging import compute_aged_resistance, compute_aged_capacity, compute_soh
from thermal import compute_temperature_step

class BatteryCell:
    """Represents a single physical lithium-ion cell in the battery pack."""

    def __init__(self, cell_id: int, initial_soc: float = 75.0, initial_temp: float = 28.0, cycle_count: int = 0):
        self.cell_id = cell_id
        self.soc = initial_soc
        self.temperature = initial_temp
        self.cycle_count = cycle_count

        self.base_capacity = compute_aged_capacity(cycle_count)
        self.capacity = self.base_capacity
        self.internal_resistance = compute_aged_resistance(cycle_count)
        self.soh = compute_soh(cycle_count)

        self.busbar_resistance = 0.0
        self.current = 0.0
        self.voltage = compute_terminal_voltage(self.soc, self.current, self.internal_resistance, self.busbar_resistance)
        self.fault_status = "NORMAL"
        self.fault_type = "none"

    def set_cycle_count(self, cycle_count: int):
        self.cycle_count = cycle_count
        self.base_capacity = compute_aged_capacity(cycle_count)
        self.soh = compute_soh(cycle_count)
        if self.fault_type != 'cell_degradation':
            self.internal_resistance = compute_aged_resistance(cycle_count)
            self.capacity = self.base_capacity

    def apply_fault(self, fault_type: str, active: bool = True):
        """Inject or clear fault on this cell."""
        if not active:
            if self.fault_type == fault_type:
                self.fault_type = "none"
                self.fault_status = "NORMAL"
                self.busbar_resistance = 0.0
                self.internal_resistance = compute_aged_resistance(self.cycle_count)
            return

        self.fault_type = fault_type
        self.fault_status = "FAULT"

        if fault_type == 'cell_degradation':
            self.internal_resistance = 0.060  # Severely increased resistance (60 mΩ)
        elif fault_type == 'busbar_fault':
            self.busbar_resistance = 0.025     # High resistance busbar connection (25 mΩ)
        elif fault_type == 'cell_imbalance':
            self.soc = max(10.0, self.soc - 25.0)  # Imbalance: significantly lower SOC

    def step_physics(self, current_A: float, flow_rate_LPM: float, q_conduction_W: float, dt_s: float = 0.2, cooling_efficiency: float = 1.0) -> dict:
        """Advance cell state by one physics time step."""
        self.current = current_A

        # 1. Update SOC
        self.soc = compute_soc_step(self.soc, self.current, self.capacity, dt_s)

        # 2. Update Terminal Voltage
        self.voltage = compute_terminal_voltage(self.soc, self.current, self.internal_resistance, self.busbar_resistance)

        # 3. Update Temperature via Thermal Energy Balance
        new_temp, dbg = compute_temperature_step(
            temperature_C=self.temperature,
            current_A=self.current,
            resistance_ohm=self.internal_resistance,
            flow_rate_LPM=flow_rate_LPM,
            q_conduction_W=q_conduction_W,
            dt_s=dt_s,
            busbar_resistance_ohm=self.busbar_resistance,
            cooling_efficiency=cooling_efficiency
        )
        self.temperature = new_temp

        return {
            'id': self.cell_id,
            'voltage': round(self.voltage, 4),
            'current': round(self.current, 3),
            'temperature': round(self.temperature, 2),
            'soc': round(self.soc, 2),
            'capacity': round(self.capacity, 3),
            'soh': round(self.soh, 1),
            'internal_resistance': round(self.internal_resistance, 5),
            'busbar_resistance': round(self.busbar_resistance, 5),
            'fault_status': self.fault_status,
            'fault_type': self.fault_type
        }

    def get_state(self) -> dict:
        return {
            'id': self.cell_id,
            'voltage': round(self.voltage, 4),
            'current': round(self.current, 3),
            'temperature': round(self.temperature, 2),
            'soc': round(self.soc, 2),
            'capacity': round(self.capacity, 3),
            'soh': round(self.soh, 1),
            'internal_resistance': round(self.internal_resistance, 5),
            'fault_status': self.fault_status,
            'fault_type': self.fault_type
        }
