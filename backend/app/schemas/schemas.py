from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    fullName: str
    email: EmailStr
    mobile: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str

# Vehicle & Battery Schemas
class VehicleCreate(BaseModel):
    make: str
    model: str
    variant: Optional[str] = None
    modelYear: Optional[int] = 2024
    vin: Optional[str] = None
    odometer: Optional[float] = 0.0

class BatteryCreate(BaseModel):
    chemistry: str = "NMC"
    capacityKwh: float = 75.0
    serialNumber: str
    bmsModel: str = "BRAIN Smart BMS v2"
    bmsFirmware: str = "v2.4.1"
    cellCount: int = 96

class TelemetryFrame(BaseModel):
    battery_id: str
    pack_voltage: float
    pack_current: float
    pack_temperature: float
    soc: float
    soh: float
    power_kw: float
    data_state: str = "REAL"
    pkl_file_source: Optional[str] = None

class PKLUploadResponse(BaseModel):
    filename: str
    status: str
    file_type: str
    summary: dict
