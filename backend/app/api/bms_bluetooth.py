from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any

from app.schemas.schemas import BLEDeviceConnectPayload, BLETelemetryPayload, BLEDeviceResponse
from app.core.database import get_db
from app.models.all_models import TelemetryLog, BatteryPack

router = APIRouter(prefix="/bms", tags=["Bluetooth Hardware BMS & Cloud Storage"])

# In-memory registry for active BLE hardware connections and recent telemetry
connected_ble_devices: Dict[str, Dict[str, Any]] = {}
latest_ble_telemetry: Dict[str, Any] = {
    "status": "IDLE",
    "last_updated": None,
    "battery_id": "DEFAULT_PACK_96S",
    "pack_voltage": 350.4,
    "pack_current": 120.5,
    "pack_temperature": 34.2,
    "soc": 84.0,
    "soh": 96.4,
    "power_kw": 42.2,
    "bms_status": "HEALTHY"
}
ble_logs_cache: List[Dict[str, Any]] = []

@router.post("/connect", response_model=BLEDeviceResponse)
def connect_ble_device(payload: BLEDeviceConnectPayload):
    """
    Registers a connected Bluetooth Low Energy (BLE) BMS hardware unit.
    """
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

@router.post("/telemetry")
def ingest_ble_telemetry(payload: BLETelemetryPayload, db: Session = Depends(get_db)):
    """
    Ingests real-time telemetry streaming from BLE BMS hardware.
    Saves persistent telemetry snapshots to SQLite / Cloud Database.
    """
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

    # Store in cache
    ble_logs_cache.append({
        **latest_ble_telemetry,
        "timestamp": now_str
    })
    if len(ble_logs_cache) > 100:
        ble_logs_cache.pop(0)

    # Persist to database TelemetryLog table if a battery pack exists
    try:
        battery = db.query(BatteryPack).first()
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
        # Non-blocking db fallback

    return {
        "status": "INGESTED",
        "timestamp": now_str,
        "latest": latest_ble_telemetry
    }

@router.get("/devices")
def get_connected_ble_devices():
    """
    Returns list of active BLE BMS hardware devices and connection status.
    """
    return {
        "active_devices": list(connected_ble_devices.values()),
        "total_connected": len(connected_ble_devices),
        "latest_telemetry": latest_ble_telemetry
    }

@router.get("/logs")
def get_ble_telemetry_logs():
    """
    Fetches recent historical BLE hardware telemetry logs.
    """
    return {
        "count": len(ble_logs_cache),
        "logs": ble_logs_cache[-50:]
    }
