"""
ble_interface.py — Backward compatibility wrapper for bluetooth.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from bluetooth import BLECommunicationLayer as BLEInterface, BLEConnectionState

__all__ = ['BLEInterface', 'BLEConnectionState']
