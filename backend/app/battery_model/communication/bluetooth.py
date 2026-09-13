"""
bluetooth.py — Backward compatibility & convenience entry point for bluetooth/ package
"""

import sys
import os

_BT_DIR = os.path.join(os.path.dirname(__file__), 'bluetooth')
sys.path.insert(0, _BT_DIR)

from ble_server import BLEServer, BLEServer as BLECommunicationLayer
from packet_transmitter import PacketTransmitter

__all__ = ['BLEServer', 'BLECommunicationLayer', 'PacketTransmitter']
