"""
electrical_model.py — Backward compatibility wrapper for electrical.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from electrical import compute_ocv, compute_terminal_voltage, compute_soc_step as compute_soc_change, compute_power

__all__ = ['compute_ocv', 'compute_terminal_voltage', 'compute_soc_change', 'compute_power']
