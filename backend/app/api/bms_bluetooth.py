from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import sys
import os
from pathlib import Path

from app.schemas.schemas import BLEDeviceConnectPayload, BLETelemetryPayload, BLEDeviceResponse
from app.core.database import get_db
from app.models.all_models import TelemetryLog, BatteryPack as DBBatteryPack

# Setup sys.path for battery_model physics imports
base_path = Path(__file__).resolve().parent.parent / "battery_model"
for p in [base_path, base_path / "battery", base_path / "bms", base_path / "faults", base_path / "calibration"]:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

try:
    from pack import BatteryPack
    from fault_manager import FaultManager
    from controller import VirtualBMSController
    from telemetry import generate_bms_telemetry
    SIMULATION_AVAILABLE = True
except Exception as e:
    SIMULATION_AVAILABLE = False
    print(f"[WARNING] Digital Twin Physics Engine load error: {e}")

router = APIRouter(prefix="/bms", tags=["Bluetooth Hardware BMS & Cloud Storage"])

# ── Digital Twin Instance ──────────────────────────────────────────────────
_pack = BatteryPack(pack_id="BRAIN001", initial_soc=84.0, initial_temp=34.2, cycle_count=428) if SIMULATION_AVAILABLE else None
_fault_mgr = FaultManager(_pack) if _pack else None
_bms = VirtualBMSController(battery_id="BRAIN001") if SIMULATION_AVAILABLE else None

_sim_state = {
    'load_current_A': 15.0,
    'sim_mode': 'discharging',
    'seq_counter': 100
}

# In-memory registry for active BLE hardware connections and recent telemetry
connected_ble_devices: Dict[str, Dict[str, Any]] = {}
latest_ble_telemetry: Dict[str, Any] = {
    "status": "IDLE",
    "last_updated": None,
    "battery_id": "BRAIN001",
    "pack_voltage": 350.4,
    "pack_current": 120.5,
    "pack_temperature": 34.2,
    "soc": 84.0,
    "soh": 96.4,
    "power_kw": 42.2,
    "bms_status": "HEALTHY"
}
ble_logs_cache: List[Dict[str, Any]] = []

def _step_simulation() -> dict:
    global latest_ble_telemetry
    if not SIMULATION_AVAILABLE or not _pack or not _bms:
        return latest_ble_telemetry

    _sim_state['seq_counter'] += 1
    summary = _pack.step(load_current_A=_sim_state['load_current_A'], dt_s=0.2)
    bms_state = _bms.process(summary, load_current_A=_sim_state['load_current_A'])
    telemetry_pkt = generate_bms_telemetry(bms_state, sequence_counter=_sim_state['seq_counter'])
    
    # Update latest telemetry cache
    latest_ble_telemetry = {
        "status": "STREAMING",
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "battery_id": telemetry_pkt.get('battery_id', 'BRAIN001'),
        "pack_voltage": telemetry_pkt.get('pack', {}).get('voltage', 350.4),
        "pack_current": telemetry_pkt.get('pack', {}).get('current', 120.5),
        "pack_temperature": telemetry_pkt.get('thermal', {}).get('max_temperature', 34.2),
        "soc": telemetry_pkt.get('cells', [{}])[0].get('soc', 84.0) if telemetry_pkt.get('cells') else 84.0,
        "soh": telemetry_pkt.get('aging', {}).get('soh', 96.4),
        "power_kw": round(telemetry_pkt.get('pack', {}).get('power', 42200) / 1000.0, 2),
        "cell_voltages": [c.get('voltage', 3.7) for c in telemetry_pkt.get('cells', [])],
        "cells": telemetry_pkt.get('cells', []),
        "thermal": telemetry_pkt.get('thermal', {}),
        "aging": telemetry_pkt.get('aging', {}),
        "fault": telemetry_pkt.get('fault', {}),
        "bms_status": telemetry_pkt.get('fault', {}).get('status', 'HEALTHY')
    }
    
    ble_logs_cache.append(latest_ble_telemetry)
    if len(ble_logs_cache) > 100:
        ble_logs_cache.pop(0)
        
    return telemetry_pkt

class FaultRequest(BaseModel):
    fault: str
    cell_id: int = 5
    active: bool = True

class StateRequest(BaseModel):
    load_current_A: Optional[float] = None
    cycle_count: Optional[int] = None
    sim_mode: Optional[str] = None

@router.get("/telemetry")
def get_live_telemetry():
    """
    Step Digital Twin physics engine & return latest standardized BMS telemetry packet.
    """
    return _step_simulation()

@router.get("/cells")
def get_cells_detail():
    """
    Returns detailed individual cell telemetry from Digital Twin pack.
    """
    if not SIMULATION_AVAILABLE or not _pack:
        return {"cells": []}
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
                'soh': c['soh'],
                'internal_resistance': c['internal_resistance'],
                'fault_status': c['fault_status'],
                'fault_type': c['fault_type']
            })
    return {
        'pack_id': _pack.pack_id,
        'cell_count': len(cells_detail),
        'cells': cells_detail,
        'timestamp': datetime.utcnow().isoformat() + "Z"
    }

@router.post("/fault")
def apply_fault_scenario(req: FaultRequest):
    """
    Injects or clears physical fault scenarios into Digital Twin.
    """
    if not SIMULATION_AVAILABLE or not _fault_mgr:
        raise HTTPException(status_code=400, detail="Physics fault manager unavailable")
    res = _fault_mgr.inject_fault(fault_name=req.fault, cell_id=req.cell_id, active=req.active)
    return res

@router.post("/state")
def update_simulation_state(req: StateRequest):
    if req.load_current_A is not None:
        _sim_state['load_current_A'] = req.load_current_A
    if req.cycle_count is not None and _pack:
        _pack.set_cycle_count(req.cycle_count)
    if req.sim_mode is not None:
        _sim_state['sim_mode'] = req.sim_mode
    return {'status': 'UPDATED', 'current_state': _sim_state}

@router.post("/connect", response_model=BLEDeviceResponse)
def connect_ble_device(payload: BLEDeviceConnectPayload):
    now_str = datetime.utcnow().isoformat() + "Z"
    connected_ble_devices[payload.device_id] = {
        "device_id": payload.device_id,
        "name": payload.name,
        "mac_address": payload.mac_address,
        "rssi": payload.rssi,
        "firmware": payload.firmware,
        "connected_at": now_str,
        "status": "CONNECTED"
    }

    return BLEDeviceResponse(
        status="CONNECTED",
        device_id=payload.device_id,
        connected_at=now_str,
        message=f"Successfully paired BLE BMS Hardware '{payload.name}' ({payload.device_id})"
    )

@router.post("/telemetry/ingest")
def ingest_ble_telemetry(payload: BLETelemetryPayload, db: Session = Depends(get_db)):
    global latest_ble_telemetry
    now = datetime.utcnow()
    now_str = now.isoformat() + "Z"

    latest_ble_telemetry = {
        "status": "STREAMING",
        "last_updated": now_str,
        "battery_id": payload.battery_id,
        "pack_voltage": payload.pack_voltage,
        "pack_current": payload.pack_current,
        "pack_temperature": payload.pack_temperature,
        "soc": payload.soc,
        "soh": payload.soh or 96.4,
        "power_kw": payload.power_kw or round(payload.pack_voltage * payload.pack_current / 1000.0, 2),
        "cell_voltages": payload.cell_voltages or [],
        "bms_status": payload.bms_status or "HEALTHY"
    }

    ble_logs_cache.append({
        **latest_ble_telemetry,
        "timestamp": now_str
    })
    if len(ble_logs_cache) > 100:
        ble_logs_cache.pop(0)

    try:
        battery = db.query(DBBatteryPack).first()
        battery_id = battery.id if battery else payload.battery_id

        log_entry = TelemetryLog(
            battery_id=battery_id,
            timestamp=now,
            pack_voltage=payload.pack_voltage,
            pack_current=payload.pack_current,
            pack_temperature=payload.pack_temperature,
            soc=payload.soc,
            soh=payload.soh or 96.4,
            power_kw=payload.power_kw or round(payload.pack_voltage * payload.pack_current / 1000.0, 2),
            data_state="REAL_BLE"
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()

    return {
        "status": "INGESTED",
        "timestamp": now_str,
        "latest": latest_ble_telemetry
    }

@router.get("/devices")
def get_connected_ble_devices():
    return {
        "active_devices": list(connected_ble_devices.values()),
        "total_connected": len(connected_ble_devices),
        "latest_telemetry": latest_ble_telemetry
    }

@router.get("/logs")
def get_ble_telemetry_logs():
    return {
        "count": len(ble_logs_cache),
        "logs": ble_logs_cache[-50:]
    }

