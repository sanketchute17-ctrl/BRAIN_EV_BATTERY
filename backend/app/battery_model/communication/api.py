"""
api.py — FastAPI REST Server for Mobile Application & Digital Twin Integration
==============================================================================
Battery Digital Twin | Communication Layer

Endpoints:
  GET  /battery/telemetry  — Returns latest standardized BMS telemetry JSON packet
  GET  /battery/cells      — Returns detailed individual cell information
  POST /battery/fault      — Applies fault scenario (e.g. {"fault": "cell_degradation", "cell_id": 5})
  GET  /battery/status     — Returns Health (SOH), Temperature, Fault state, Cycle count
"""

import sys
import os
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'battery')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'physics')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'bms')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'faults')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'calibration')))

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    print("[WARNING] FastAPI / uvicorn not installed. Run: pip install fastapi uvicorn")

from pack import BatteryPack
from fault_manager import FaultManager
from controller import VirtualBMSController
from telemetry import generate_bms_telemetry
from bluetooth import BLECommunicationLayer
from aging import compute_soh

# ── Shared Digital Twin Core Instance ──────────────────────────────────────────
_pack = BatteryPack(pack_id="BRAIN001", initial_soc=75.0, initial_temp=28.0, cycle_count=120)
_fault_mgr = FaultManager(_pack)
_bms = VirtualBMSController(battery_id="BRAIN001")
_ble = BLECommunicationLayer(device_name="EV_BMS_DT_001")

_state = {
    'load_current_A': 15.0,
    'sim_mode': 'discharging'
}

def _step_simulation() -> dict:
    summary = _pack.step(load_current_A=_state['load_current_A'], dt_s=0.2)
    bms_state = _bms.process(summary, load_current_A=_state['load_current_A'])
    telemetry_pkt = generate_bms_telemetry(bms_state)
    _ble.transmit_packet(telemetry_pkt)
    return telemetry_pkt

# ── FastAPI Application ───────────────────────────────────────────────────────
if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="Battery Digital Twin REST API",
        description="Mobile Application & Simulation Telemetry Endpoints",
        version="3.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class FaultRequest(BaseModel):
        fault: str
        cell_id: int = 5
        active: bool = True

    class StateRequest(BaseModel):
        load_current_A: float = None
        cycle_count: int = None
        sim_mode: str = None

    @app.get("/")
    def health():
        return {
            "service": "Battery Digital Twin API",
            "status": "RUNNING",
            "version": "3.0.0",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }

    @app.get("/battery/telemetry")
    def get_telemetry():
        """Get latest BMS telemetry packet."""
        return _step_simulation()

    @app.get("/battery/cells")
    def get_cells():
        """Get detailed individual cell information."""
        summary = _pack.get_pack_summary()
        cells_detail = []
        for m in summary.get('modules', []):
            for c in m.get('cells', []):
                cells_detail.append({
                    'id': c['id'],
                    'voltage': c['voltage'],
                    'current': c['current'],
                    'temperature': c['temperature'],
                    'soc': c['soc'],
                    'capacity': c['capacity'],
                    'soh': c['soh'],
                    'internal_resistance': c['internal_resistance'],
                    'busbar_resistance': c.get('busbar_resistance', 0.0),
                    'fault_status': c['fault_status'],
                    'fault_type': c['fault_type']
                })
        return {
            'pack_id': _pack.pack_id,
            'cell_count': len(cells_detail),
            'cells': cells_detail,
            'timestamp': datetime.datetime.utcnow().isoformat() + "Z"
        }

    @app.post("/battery/fault")
    def apply_fault(req: FaultRequest):
        """Inject or clear a physical fault scenario."""
        res = _fault_mgr.inject_fault(fault_name=req.fault, cell_id=req.cell_id, active=req.active)
        if not res.get('success'):
            raise HTTPException(status_code=400, detail=res.get('error', 'Failed to apply fault'))
        return res

    @app.get("/battery/status")
    def get_status():
        """Get battery overall health, temperature, fault state, and cycle count."""
        summary = _pack.get_pack_summary()
        bms_state = _bms.process(summary, load_current_A=_state['load_current_A'])
        soh_pct = compute_soh(_pack.cycle_count)

        return {
            'battery_id': _pack.pack_id,
            'health_soh_percent': soh_pct,
            'max_temperature_C': summary['max_temperature'],
            'avg_temperature_C': summary['avg_temperature'],
            'fault_state': bms_state['fault_status'],
            'active_faults': bms_state['active_faults'],
            'cycle_count': _pack.cycle_count,
            'contactor_state': bms_state['contactor_state'],
            'ble_status': _ble.connection_state,
            'timestamp': datetime.datetime.utcnow().isoformat() + "Z"
        }

    @app.post("/battery/state")
    def update_state(req: StateRequest):
        if req.load_current_A is not None:
            _state['load_current_A'] = req.load_current_A
        if req.cycle_count is not None:
            _pack.set_cycle_count(req.cycle_count)
        if req.sim_mode is not None:
            _state['sim_mode'] = req.sim_mode
        return {'status': 'UPDATED', 'current_state': _state, 'cycle_count': _pack.cycle_count}

if __name__ == '__main__':
    if not FASTAPI_AVAILABLE:
        print("FastAPI is not installed. Please install via: pip install fastapi uvicorn")
        sys.exit(1)
    uvicorn.run(app, host="0.0.0.0", port=8000)
