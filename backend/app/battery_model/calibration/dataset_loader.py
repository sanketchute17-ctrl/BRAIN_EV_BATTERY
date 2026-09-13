"""
dataset_loader.py — Automated Battery Dataset Discovery & Normalisation
========================================================================
Battery Digital Twin | Calibration Layer

Scans dataset folders automatically:
  - battery_model/datasets/NASA/   (.mat / .csv format)
  - battery_model/datasets/CALCE/  (.csv / .txt format)
  - battery_model/datasets/Oxford/ (.csv / .txt format)

Reads dataset format, extracts required parameters (V, I, T, Q, Cycle),
and requires NO manual code changes when new dataset files are dropped in.
"""

import os
import csv
from typing import Optional, Dict, List, Any

try:
    import scipy.io
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'datasets'))
NASA_DIR   = os.path.join(BASE_DIR, 'NASA')
CALCE_DIR  = os.path.join(BASE_DIR, 'CALCE')
OXFORD_DIR = os.path.join(BASE_DIR, 'Oxford')

def scan_all_datasets() -> Dict[str, List[str]]:
    """Scan NASA, CALCE, Oxford dataset directories for data files."""
    discovered = {'NASA': [], 'CALCE': [], 'Oxford': []}

    dirs = {'NASA': NASA_DIR, 'CALCE': CALCE_DIR, 'Oxford': OXFORD_DIR}
    for name, path in dirs.items():
        if os.path.exists(path):
            for root, _, files in os.walk(path):
                for f in files:
                    ext = f.lower()
                    if ext.endswith(('.csv', '.mat', '.txt', '.xlsx')):
                        discovered[name].append(os.path.join(root, f))
    return discovered

def check_dataset_availability() -> Dict[str, Any]:
    discovered = scan_all_datasets()
    total_files = sum(len(v) for v in discovered.values())

    return {
        'total_datasets_found': total_files,
        'discovered_files': discovered,
        'nasa_count': len(discovered['NASA']),
        'calce_count': len(discovered['CALCE']),
        'oxford_count': len(discovered['Oxford']),
        'status': 'DATASETS_AVAILABLE' if total_files > 0 else 'MISSING_DATASETS',
        'required_paths': {
            'NASA': NASA_DIR,
            'CALCE': CALCE_DIR,
            'Oxford': OXFORD_DIR
        }
    }

def _find_col(headers: List[str], candidates: List[str]) -> Optional[str]:
    for cand in candidates:
        for h in headers:
            if cand.lower() in h.lower().replace(' ', '_'):
                return h
    return None

def _safe_float(val: Any) -> Optional[float]:
    if val is None: return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def load_csv_dataset(file_path: str, dataset_name: str) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        return {'error': f'File not found: {file_path}', 'dataset': dataset_name}

    rows = []
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows.append(r)
    except Exception as e:
        return {'error': f'Failed to parse CSV: {str(e)}', 'file': file_path, 'dataset': dataset_name}

    if not rows:
        return {'error': 'Empty dataset file', 'file': file_path, 'dataset': dataset_name}

    headers = list(rows[0].keys())

    v_col = _find_col(headers, ['voltage', 'v_cell', 'v', 'vbatt', 'cell_voltage'])
    i_col = _find_col(headers, ['current', 'i_cell', 'i', 'ibatt', 'current_a'])
    t_col = _find_col(headers, ['temperature', 'temp', 't_cell', 't_degc', 't'])
    q_col = _find_col(headers, ['capacity', 'q', 'ah', 'cap_ah', 'discharged_capacity'])
    c_col = _find_col(headers, ['cycle', 'cycle_index', 'cycle_number', 'n'])
    time_col = _find_col(headers, ['time', 'time_s', 'test_time', 't_s', 'timestamp'])

    voltages, currents, temps, capacities, cycles, times = [], [], [], [], [], []

    for idx, row in enumerate(rows):
        v = _safe_float(row.get(v_col)) if v_col else None
        i = _safe_float(row.get(i_col)) if i_col else None
        t = _safe_float(row.get(t_col)) if t_col else None
        q = _safe_float(row.get(q_col)) if q_col else None
        c = _safe_float(row.get(c_col)) if c_col else None
        tm = _safe_float(row.get(time_col)) if time_col else float(idx)

        if v is not None: voltages.append(v)
        if i is not None: currents.append(i)
        if t is not None: temps.append(t)
        if q is not None: capacities.append(q)
        if c is not None: cycles.append(c)
        times.append(tm)

    return {
        'status': 'SUCCESS',
        'dataset': dataset_name,
        'file': file_path,
        'total_records': len(rows),
        'columns_found': headers,
        'time_s': times,
        'voltage_V': voltages,
        'current_A': currents,
        'temperature_C': temps,
        'capacity_Ah': capacities,
        'cycle_index': cycles
    }

def load_nasa_mat_dataset(file_path: str) -> Dict[str, Any]:
    if not SCIPY_AVAILABLE:
        return {'error': 'scipy required for .mat files', 'dataset': 'NASA', 'file': file_path}

    if not os.path.exists(file_path):
        return {'error': f'File not found: {file_path}', 'dataset': 'NASA'}

    try:
        mat = scipy.io.loadmat(file_path, simplify_cells=True)
        key = [k for k in mat.keys() if not k.startswith('_')][0]
        return {
            'status': 'SUCCESS',
            'dataset': 'NASA',
            'file': file_path,
            'key': key,
            'raw_data': mat[key]
        }
    except Exception as e:
        return {'error': f'Failed to parse MAT file: {str(e)}', 'file': file_path, 'dataset': 'NASA'}

def load_and_normalize_dataset(file_path: str, dataset_type: str) -> Dict[str, Any]:
    if dataset_type.upper() == 'NASA' and file_path.lower().endswith('.mat'):
        return load_nasa_mat_dataset(file_path)
    return load_csv_dataset(file_path, dataset_type)
