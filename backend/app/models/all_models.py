from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    mobile = Column(String(50), nullable=True)
    role = Column(String(50), default="OPERATOR") # OPERATOR | RESEARCHER | ADMIN
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicles = relationship("Vehicle", back_populates="owner")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    variant = Column(String(100), nullable=True)
    model_year = Column(Integer, nullable=True)
    vin = Column(String(100), nullable=True)
    odometer_km = Column(Float, default=0.0)
    registered_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="vehicles")
    battery = relationship("BatteryPack", back_populates="vehicle", uselist=False)

class BatteryPack(Base):
    __tablename__ = "battery_packs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=True)
    serial_number = Column(String(100), unique=True, nullable=False)
    chemistry = Column(String(50), default="NMC") # NMC | LFP | NCA
    nominal_capacity_kwh = Column(Float, default=75.0)
    nominal_voltage = Column(Float, default=350.0)
    cell_count = Column(Integer, default=96)
    bms_model = Column(String(100), default="BRAIN Smart BMS v2")
    bms_firmware = Column(String(50), default="v2.4.1")
    current_soh = Column(Float, default=96.4)
    cycle_count = Column(Integer, default=142)
    status = Column(String(50), default="HEALTHY") # HEALTHY | WATCH | WARNING | CRITICAL
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="battery")
    telemetry_logs = relationship("TelemetryLog", back_populates="battery")

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    battery_id = Column(String(36), ForeignKey("battery_packs.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    pack_voltage = Column(Float, nullable=False)
    pack_current = Column(Float, nullable=False)
    pack_temperature = Column(Float, nullable=False)
    soc = Column(Float, nullable=False)
    soh = Column(Float, nullable=False)
    power_kw = Column(Float, nullable=False)
    data_state = Column(String(20), default="REAL") # REAL | ESTIMATED | PREDICTED | SIMULATED
    pkl_file_source = Column(String(255), nullable=True)

    battery = relationship("BatteryPack", back_populates="telemetry_logs")
