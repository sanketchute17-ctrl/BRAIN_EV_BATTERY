"""
pack.py — Full Battery Pack Hierarchy & Multi-Cell Simulation Engine
=====================================================================
Battery Digital Twin | Battery Architecture Layer

Hierarchy:
  Battery Pack
    ├── Module 1 (Cell 1, Cell 2, Cell 3, Cell 4)
    └── Module 2 (Cell 5, Cell 6, Cell 7, Cell 8)
"""

import sys
import os
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'physics'))

from cell import BatteryCell
from module import BatteryModule
from thermal import compute_cell_conduction_net

class BatteryPack:
    """Top-level Battery Pack model managing modules, cells, and thermal physics integration."""

    def __init__(self, pack_id: str = "BRAIN001", num_modules: int = 2, cells_per_module: int = 4,
                 initial_soc: float = 75.0, initial_temp: float = 28.0, cycle_count: int = 100):
        self.pack_id = pack_id
        self.cycle_count = cycle_count
        self.cooling_flow_LPM = 8.5
        self.cooling_efficiency = 1.0
        self.sim_time_s = 0.0

        all_cells = []
        cell_counter = 1
        self.modules: List[BatteryModule] = []

        for m_idx in range(1, num_modules + 1):
            m_cells = []
            for _ in range(cells_per_module):
                cell = BatteryCell(
                    cell_id=cell_counter,
                    initial_soc=initial_soc,
                    initial_temp=initial_temp,
                    cycle_count=cycle_count
                )
                m_cells.append(cell)
                all_cells.append(cell)
                cell_counter += 1
            module = BatteryModule(module_id=m_idx, cells=m_cells)
            self.modules.append(module)

        self.all_cells: List[BatteryCell] = all_cells

    def set_cycle_count(self, cycle_count: int):
        self.cycle_count = cycle_count
        for cell in self.all_cells:
            cell.set_cycle_count(cycle_count)

    def set_cooling_flow(self, flow_LPM: float):
        self.cooling_flow_LPM = max(0.0, flow_LPM)

    def set_cooling_efficiency(self, efficiency: float):
        self.cooling_efficiency = max(0.0, min(1.0, efficiency))

    def apply_fault(self, fault_type: str, cell_id: int = None, active: bool = True):
        """Inject or clear a physical fault across pack or specific cell."""
        if fault_type == 'cooling_failure':
            self.cooling_efficiency = 0.0 if active else 1.0
            return

        if cell_id is not None:
            target_cell = next((c for c in self.all_cells if c.cell_id == cell_id), None)
            if target_cell:
                target_cell.apply_fault(fault_type, active)
        else:
            # Default target for cell degradation / busbar / imbalance if no cell specified
            if len(self.all_cells) >= 5:
                self.all_cells[4].apply_fault(fault_type, active)  # Cell 5 default

    def step(self, load_current_A: float, dt_s: float = 0.2) -> Dict[str, Any]:
        """
        Advance full pack simulation by one time step:
          1. Calculate Fourier heat conduction between adjacent cells across modules.
          2. Step cell electrical, thermal, and Coulomb integration.
          3. Aggregate pack telemetry.
        """
        self.sim_time_s += dt_s
        cell_temps = [c.temperature for c in self.all_cells]

        cell_results = []
        for idx, cell in enumerate(self.all_cells):
            q_cond = compute_cell_conduction_net(idx, cell_temps)
            c_res = cell.step_physics(
                current_A=load_current_A,
                flow_rate_LPM=self.cooling_flow_LPM,
                q_conduction_W=q_cond,
                dt_s=dt_s,
                cooling_efficiency=self.cooling_efficiency
            )
            cell_results.append(c_res)

        return self.get_pack_summary()

    def get_pack_summary(self) -> Dict[str, Any]:
        voltages = [c.voltage for c in self.all_cells]
        temps = [c.temperature for c in self.all_cells]
        socs = [c.soc for c in self.all_cells]

        total_v = sum(voltages)
        max_t = max(temps) if temps else 25.0
        min_t = min(temps) if temps else 25.0
        avg_t = sum(temps) / len(temps) if temps else 25.0
        avg_soc = sum(socs) / len(socs) if socs else 0.0

        faults_active = any(c.fault_status != "NORMAL" for c in self.all_cells) or (self.cooling_efficiency == 0.0)
        fault_status_text = "FAULT" if faults_active else "NORMAL"

        return {
            'pack_id': self.pack_id,
            'pack_voltage': round(total_v, 2),
            'max_temperature': round(max_t, 2),
            'min_temperature': round(min_t, 2),
            'avg_temperature': round(avg_t, 2),
            'pack_soc': round(avg_soc, 2),
            'cycle_number': self.cycle_count,
            'cooling_flow_LPM': self.cooling_flow_LPM,
            'cooling_efficiency': self.cooling_efficiency,
            'fault_status': fault_status_text,
            'modules': [
                {
                    'module_id': m.module_id,
                    'voltage': round(m.voltage, 2),
                    'avg_temperature': round(m.avg_temperature, 2),
                    'cells': m.get_cell_states()
                }
                for m in self.modules
            ]
        }
