"""
module.py — Battery Module Container & Physics Manager
=====================================================
Battery Digital Twin | Battery Architecture Layer

Represents a Battery Module containing a series list of BatteryCell instances.
Example:
  Module 1: Cell 1, Cell 2, Cell 3, Cell 4
  Module 2: Cell 5, Cell 6, Cell 7, Cell 8
"""

from typing import List
from cell import BatteryCell

class BatteryModule:
    """Represents a module of series-connected battery cells."""

    def __init__(self, module_id: int, cells: List[BatteryCell]):
        self.module_id = module_id
        self.cells = cells

    @property
    def voltage(self) -> float:
        return sum(c.voltage for c in self.cells)

    @property
    def max_temperature(self) -> float:
        return max(c.temperature for c in self.cells) if self.cells else 25.0

    @property
    def min_temperature(self) -> float:
        return min(c.temperature for c in self.cells) if self.cells else 25.0

    @property
    def avg_temperature(self) -> float:
        return sum(c.temperature for c in self.cells) / len(self.cells) if self.cells else 25.0

    @property
    def avg_soc(self) -> float:
        return sum(c.soc for c in self.cells) / len(self.cells) if self.cells else 0.0

    def get_cell_states(self) -> List[dict]:
        return [c.get_state() if hasattr(c, 'get_state') else {
            'id': c.cell_id,
            'voltage': round(c.voltage, 4),
            'current': round(c.current, 3),
            'temperature': round(c.temperature, 2),
            'soc': round(c.soc, 2),
            'capacity': round(c.capacity, 3),
            'soh': round(c.soh, 1),
            'internal_resistance': round(c.internal_resistance, 5),
            'fault_status': c.fault_status,
            'fault_type': c.fault_type
        } for c in self.cells]
