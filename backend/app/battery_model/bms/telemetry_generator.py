"""
telemetry_generator.py — BMS Telemetry Packet Generator Interface
===================================================================
Battery Digital Twin | BMS Layer

Reads Digital Twin states from Virtual BMS and generates standard JSON packets.
Does NOT compute physics — only packages BMS outputs.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from telemetry import generate_bms_telemetry, telemetry_to_json

def generate_telemetry_packet(bms_state: dict, sequence_counter: int = 1) -> dict:
    return generate_bms_telemetry(bms_state, sequence_counter=sequence_counter)

def packet_to_json(telemetry_packet: dict, indent: int = None) -> str:
    return telemetry_to_json(telemetry_packet, indent=indent)

__all__ = ['generate_telemetry_packet', 'packet_to_json', 'generate_bms_telemetry']
