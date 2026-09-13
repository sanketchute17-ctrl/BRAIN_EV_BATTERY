"""
aging_model.py — Backward compatibility wrapper for aging.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from aging import compute_aged_resistance, compute_aged_capacity, compute_soh

__all__ = ['compute_aged_resistance', 'compute_aged_capacity', 'compute_soh']
