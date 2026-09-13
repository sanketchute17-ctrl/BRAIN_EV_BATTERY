"""
calibration_engine.py — Dataset Calibration Pipeline Coordinator
===================================================================
Battery Digital Twin | Calibration Layer

Coordinates dataset discovery, analysis, parameter extraction, and updates:

Real Battery Dataset
        ↓
Dataset Analysis (dataset_loader.py)
        ↓
Parameter Extraction (parameter_extractor.py)
        ↓
Calibrated Battery Parameters (parameter_updater.py)
        ↓
Physics Engine
        ↓
Digital Twin Simulation

Reports system calibration status:
  - DEFAULT PARAMETER MODE — NOT DATA CALIBRATED (when datasets are missing)
  - CALIBRATED / PARTIALLY VALIDATED / VALIDATED (when datasets are processed)
"""

import os
import sys
from typing import Dict, Any

try:
    from .dataset_loader import scan_all_datasets, load_and_normalize_dataset, check_dataset_availability
    from .parameter_extractor import extract_battery_parameters
    from .parameter_updater import update_parameter_files
except ImportError:
    from dataset_loader import scan_all_datasets, load_and_normalize_dataset, check_dataset_availability
    from parameter_extractor import extract_battery_parameters
    from parameter_updater import update_parameter_files

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'parameters'))
from param_loader import check_system_calibration_status


def run_calibration_pipeline() -> Dict[str, Any]:
    """
    Run full dataset calibration pipeline across all discovered datasets.

    Returns:
        Complete calibration report dict.
    """
    availability = check_dataset_availability()
    discovered   = scan_all_datasets()

    report = {
        'timestamp': None,
        'datasets_found': availability['total_datasets_found'],
        'calibration_mode': 'DEFAULT PARAMETER MODE — NOT DATA CALIBRATED',
        'system_status': 'DEFAULT',
        'details': [],
        'updated_files': []
    }

    if availability['total_datasets_found'] == 0:
        report['message'] = (
            'No raw datasets found in battery_model/datasets/.\n'
            'The Digital Twin will continue operating in DEFAULT PARAMETER MODE.\n'
            'To calibrate, add dataset files to:\n'
            '  - battery_model/datasets/NASA/   (.mat files)\n'
            '  - battery_model/datasets/CALCE/  (.csv files)\n'
            '  - battery_model/datasets/Oxford/ (.csv files)'
        )
        sys_status, sys_details = check_system_calibration_status()
        report['system_status'] = sys_status
        report['calibration_summary'] = sys_details
        return report

    # Process discovered datasets
    for ds_type, file_list in discovered.items():
        for file_path in file_list:
            norm_ds = load_and_normalize_dataset(file_path, ds_type)
            if norm_ds.get('status') == 'SUCCESS':
                extracted = extract_battery_parameters(norm_ds)
                if extracted.get('status') == 'SUCCESS':
                    update_res = update_parameter_files(extracted)
                    report['details'].append({
                        'dataset_type': ds_type,
                        'file': os.path.basename(file_path),
                        'extracted_parameters': extracted.get('parameters', {}),
                        'update_result': update_res
                    })
                    if update_res.get('updated_files'):
                        report['updated_files'].extend(update_res['updated_files'])

    sys_status, sys_details = check_system_calibration_status()
    report['system_status'] = sys_status
    report['calibration_mode'] = sys_details['status_description']
    report['calibration_summary'] = sys_details

    return report


# ── Standalone Test ───────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 60)
    print("  Calibration Engine — Standalone Test")
    print("=" * 60)

    res = run_calibration_pipeline()
    print(f"\nSystem Status    : {res['system_status']}")
    print(f"Calibration Mode : {res['calibration_mode']}")
    print(f"Datasets Found   : {res['datasets_found']}")

    if res.get('message'):
        print(f"\n{res['message']}")

    if res.get('updated_files'):
        print(f"\nUpdated Parameter Files: {set(res['updated_files'])}")
    print()
