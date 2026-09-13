"""
controller.py — Virtual BMS Controller ECU
===========================================
Battery Digital Twin | BMS Layer

The BMS Controller does NOT compute artificial/synthetic values.
It strictly processes sensor outputs from the Digital Twin simulation engine:
  - Cell level data: Individual V, T, SOC
  - Pack level data: Pack V, I, Max T, Capacity, Cycle Count, Fault Status

Safety limits enforced:
  - Overvoltage: > 4.25 V
  - Undervoltage: < 2.45 V
  - Overtemperature: > 60.0 °C
  - Overcurrent: > 52.0 A
  - Cell Imbalance Delta V: > 0.030 V
"""

from virtual_sensor import read_cell_sensors, read_current_sensor, read_flow_sensor

class VirtualBMSController:
    """Virtual BMS Controller ECU monitoring cell & pack state."""

    OV_LIMIT = 4.25
    UV_LIMIT = 2.45
    OT_LIMIT = 60.0
    OC_LIMIT = 52.0
    BAL_LIMIT = 0.030

    def __init__(self, battery_id: str = "BRAIN001"):
        self.battery_id = battery_id
        self.contactor_state = "CLOSED"
        self.active_faults = []
        self.balancing_active = False

    def process(self, pack_summary: dict, load_current_A: float = 15.0) -> dict:
        """Process Digital Twin pack outputs through BMS safety logic."""
        self.active_faults = []

        all_cells_raw = []
        for m in pack_summary.get('modules', []):
            all_cells_raw.extend(m.get('cells', []))

        sensed_cells = [read_cell_sensors(c) for c in all_cells_raw]
        sensed_current = read_current_sensor(load_current_A)
        sensed_flow = read_flow_sensor(pack_summary.get('cooling_flow_LPM', 8.5))

        voltages = [c['sensed_voltage_V'] for c in sensed_cells]
        temperatures = [c['sensed_temp_C'] for c in sensed_cells]

        max_v = max(voltages) if voltages else 0.0
        min_v = min(voltages) if voltages else 0.0
        delta_v = round(max_v - min_v, 4)
        max_t = max(temperatures) if temperatures else 25.0

        if any(v > self.OV_LIMIT for v in voltages):
            self.active_faults.append("OVERVOLTAGE")
        if any(v < self.UV_LIMIT for v in voltages):
            self.active_faults.append("UNDERVOLTAGE")
        if max_t > self.OT_LIMIT:
            self.active_faults.append("OVER_TEMPERATURE")
        if abs(sensed_current) > self.OC_LIMIT:
            self.active_faults.append("OVERCURRENT")
        if delta_v > self.BAL_LIMIT:
            self.active_faults.append("CELL_IMBALANCE")
        if pack_summary.get('cooling_efficiency', 1.0) == 0.0:
            self.active_faults.append("COOLING_FAILURE")

        for c in sensed_cells:
            if c.get('fault_type') == 'cell_degradation':
                self.active_faults.append(f"CELL_DEGRADATION:cell_{c['id']}")
            elif c.get('fault_type') == 'busbar_fault':
                self.active_faults.append(f"BUSBAR_FAULT:cell_{c['id']}")

        critical_faults = {'OVERCURRENT', 'OVER_TEMPERATURE', 'COOLING_FAILURE'}
        if any(f in critical_faults for f in self.active_faults):
            self.contactor_state = "OPEN"
        else:
            self.contactor_state = "CLOSED"

        self.balancing_active = delta_v > self.BAL_LIMIT
        dedup_faults = list(set(self.active_faults))

        fault_status_str = "CRITICAL" if self.contactor_state == "OPEN" else ("WARNING" if len(dedup_faults) > 0 else "NORMAL")

        return {
            'battery_id': self.battery_id,
            'pack_voltage': round(sum(voltages), 2),
            'pack_current': sensed_current,
            'max_temperature': round(max_t, 2),
            'cycle_number': pack_summary.get('cycle_number', 100),
            'contactor_state': self.contactor_state,
            'balancing_active': self.balancing_active,
            'fault_status': fault_status_str,
            'active_faults': dedup_faults,
            'sensed_cells': sensed_cells
        }
