"""
thermal_model.py — Backward compatibility wrapper for thermal.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from thermal import compute_joule_heat, compute_fourier_conduction, compute_temperature_step

__all__ = ['compute_joule_heat', 'compute_fourier_conduction', 'compute_temperature_step']
