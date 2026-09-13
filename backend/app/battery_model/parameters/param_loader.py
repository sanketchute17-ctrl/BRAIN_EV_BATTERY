"""
param_loader.py — Parameter Loading & Metadata Helper Utility
==============================================================
Battery Digital Twin | Parameters Layer

Extracts raw parameter values from metadata-wrapped JSON objects:
  {"value": X, "unit": "...", "source": "...", "calibrated": false}

Provides backward-compatible parameter extraction for physics engines.
"""

import json
import os
from typing import Any, Tuple

def get_param_val(obj: Any) -> Any:
    """Extract raw value whether obj is a scalar or a metadata dict."""
    if isinstance(obj, dict) and "value" in obj:
        return obj["value"]
    return obj

def get_param_meta(obj: Any) -> dict:
    """Extract metadata dict, creating default structure if scalar."""
    if isinstance(obj, dict) and "value" in obj:
        return obj
    return {
        "value": obj,
        "unit": "unknown",
        "source": "unspecified",
        "calibrated": False,
        "dataset_used": None
    }

def load_json_params(file_path: str) -> dict:
    """Load JSON parameter file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_parameter_dict(file_name: str) -> dict:
    """Load parameter JSON from parameters/ directory."""
    param_dir = os.path.dirname(__file__)
    path = os.path.join(param_dir, file_name)
    return load_json_params(path)

def check_system_calibration_status(param_files: list[str] = None) -> Tuple[str, dict]:
    """
    Check calibration state across all parameter files.

    Returns:
      (status_string, details_dict)
      status_string: 'DEFAULT', 'CALIBRATED', 'PARTIALLY VALIDATED', or 'VALIDATED'
    """
    if param_files is None:
        param_files = ['battery_parameters.json', 'aging_parameters.json', 'cooling_parameters.json', 'thermal_parameters.json']

    total_params = 0
    calibrated_params = 0
    datasets_used = set()

    param_dir = os.path.dirname(__file__)

    for fname in param_files:
        path = os.path.join(param_dir, fname)
        if not os.path.exists(path):
            continue
        data = load_json_params(path)

        def _scan(node):
            nonlocal total_params, calibrated_params
            if isinstance(node, dict):
                if "value" in node:
                    total_params += 1
                    if node.get("calibrated", False):
                        calibrated_params += 1
                    if node.get("dataset_used"):
                        datasets_used.add(node["dataset_used"])
                else:
                    for k, v in node.items():
                        if not k.startswith("_"):
                            _scan(v)

        _scan(data)

    if calibrated_params == 0:
        status = "DEFAULT"
    elif calibrated_params == total_params:
        status = "CALIBRATED"
    else:
        status = "PARTIALLY VALIDATED"

    return status, {
        "total_parameters": total_params,
        "calibrated_parameters": calibrated_params,
        "calibration_percentage": round((calibrated_params / total_params * 100.0) if total_params > 0 else 0.0, 1),
        "datasets_used": list(datasets_used),
        "status_description": f"{status} PARAMETER MODE" if status == "DEFAULT" else f"CALIBRATED MODE ({calibrated_params}/{total_params} parameters calibrated)"
    }
