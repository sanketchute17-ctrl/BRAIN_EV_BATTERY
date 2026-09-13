"""
bms_controller.py — Backward compatibility wrapper for controller.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from controller import VirtualBMSController as BMSController

__all__ = ['BMSController']
