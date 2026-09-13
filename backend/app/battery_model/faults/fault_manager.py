"""
fault_manager.py — Battery Digital Twin Fault Injection Manager
================================================================
Battery Digital Twin | Faults Layer

Manages physics-based fault injections:
  1. Cell Degradation:
     Resistance ↑ => Joule Heat ↑ => Temperature ↑ => Terminal Voltage Drop

  2. Cooling Failure:
     Cooling Efficiency ↓ => Heat Removal ↓ => Thermal Accumulation

  3. Cell Imbalance:
     Different SOC between cells => Voltage Imbalance => BMS Warning

  4. Busbar Resistance Fault:
     Connection Resistance ↑ => Voltage Loss => Localized Heating
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'battery'))
from pack import BatteryPack

class FaultManager:
    """Manages injection and tracking of fault scenarios on the Digital Twin pack."""

    AVAILABLE_FAULTS = {
        'cell_degradation': 'Increased cell internal resistance causing thermal build-up and voltage sag.',
        'cooling_failure': 'Reduced/zero coolant flow causing thermal accumulation.',
        'cell_imbalance': 'SOC offset between cells creating module voltage delta imbalance.',
        'busbar_fault': 'Increased busbar connection resistance causing voltage drop and local heating.'
    }

    def __init__(self, pack: BatteryPack):
        self.pack = pack
        self.active_faults = {
            'cell_degradation': False,
            'cooling_failure': False,
            'cell_imbalance': False,
            'busbar_fault': False
        }
        self.fault_details = {}

    def inject_fault(self, fault_name: str, cell_id: int = 5, active: bool = True) -> dict:
        """Inject or clear a specific physical fault."""
        if fault_name not in self.AVAILABLE_FAULTS:
            return {
                'success': False,
                'error': f"Unknown fault '{fault_name}'. Available faults: {list(self.AVAILABLE_FAULTS.keys())}"
            }

        self.active_faults[fault_name] = active
        self.pack.apply_fault(fault_type=fault_name, cell_id=cell_id, active=active)

        self.fault_details[fault_name] = {
            'active': active,
            'target_cell_id': cell_id if fault_name != 'cooling_failure' else 'PACK',
            'description': self.AVAILABLE_FAULTS[fault_name]
        }

        return {
            'success': True,
            'fault': fault_name,
            'active': active,
            'cell_id': cell_id if fault_name != 'cooling_failure' else 'PACK',
            'all_active_faults': self.active_faults
        }

    def clear_all_faults(self):
        """Clear all active faults on the battery pack."""
        for f in list(self.active_faults.keys()):
            self.active_faults[f] = False
            self.pack.apply_fault(fault_type=f, cell_id=None, active=False)
        self.fault_details.clear()
        return {'status': 'ALL_FAULTS_CLEARED', 'active_faults': self.active_faults}

    def get_status(self) -> dict:
        return {
            'active_faults': self.active_faults,
            'details': self.fault_details
        }
