import os
import pickle
import numpy as np
import pandas as pd
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("BRAIN.PKLSampler")

class PKLSimulationEngine:
    """
    Robust Loader & Inference Engine for user-provided .pkl files.
    Supports:
    - Serialized Pandas DataFrames (Telemetry time-series)
    - Pre-trained ML Models (Scikit-Learn, XGBoost, PyTorch, Custom objects)
    - Dictionary-based simulation parameters and cycle logs
    """
    def __init__(self, pkl_dir: str):
        self.pkl_dir = pkl_dir
        self.loaded_models: Dict[str, Any] = {}
        self.loaded_datasets: Dict[str, Any] = {}
        self.scan_and_load_pkl_files()

    def scan_and_load_pkl_files(self):
        """Scans the directory for all .pkl files and loads them into memory."""
        if not os.path.exists(self.pkl_dir):
            os.makedirs(self.pkl_dir, exist_ok=True)
            logger.info(f"Created PKL storage directory at: {self.pkl_dir}")
            return

        pkl_files = [f for f in os.listdir(self.pkl_dir) if f.endswith('.pkl')]
        logger.info(f"Found {len(pkl_files)} .pkl files in {self.pkl_dir}")

        for filename in pkl_files:
            filepath = os.path.join(self.pkl_dir, filename)
            try:
                with open(filepath, 'rb') as f:
                    content = pickle.load(f)
                
                if isinstance(content, (pd.DataFrame, pd.Series)):
                    self.loaded_datasets[filename] = {
                        "type": "DATAFRAME",
                        "shape": content.shape,
                        "data": content
                    }
                    logger.info(f"Loaded DataFrame PKL '{filename}': shape {content.shape}")
                elif hasattr(content, "predict"):
                    self.loaded_models[filename] = {
                        "type": "ML_MODEL",
                        "model": content
                    }
                    logger.info(f"Loaded ML Model PKL '{filename}' with predict() method.")
                elif isinstance(content, dict):
                    self.loaded_datasets[filename] = {
                        "type": "DICTIONARY",
                        "keys": list(content.keys()),
                        "data": content
                    }
                    logger.info(f"Loaded Dictionary PKL '{filename}' with keys: {list(content.keys())[:5]}")
                else:
                    self.loaded_datasets[filename] = {
                        "type": "GENERIC_OBJECT",
                        "data": content
                    }
                    logger.info(f"Loaded Generic Object PKL '{filename}'")
            except Exception as e:
                logger.error(f"Failed to load PKL file '{filename}': {str(e)}")

    def get_summary(self) -> Dict[str, Any]:
        return {
            "loaded_models_count": len(self.loaded_models),
            "loaded_datasets_count": len(self.loaded_datasets),
            "models": list(self.loaded_models.keys()),
            "datasets": list(self.loaded_datasets.keys())
        }


    def run_inference_or_sample(self, filename: Optional[str] = None, step_idx: int = 0) -> Dict[str, Any]:
        """
        Samples a telemetry frame or runs model prediction using the loaded .pkl file.
        Falls back to realistic synthetic battery dynamics if no .pkl is provided.
        """
        if filename and filename in self.loaded_models:
            model_obj = self.loaded_models[filename]["model"]
            try:
                # Sample input feature vector [Voltage, Current, Temp, SoC]
                dummy_features = np.array([[365.2, -18.5, 34.2, 0.82]])
                prediction = model_obj.predict(dummy_features)
                return {
                    "source": f"PKL_MODEL:{filename}",
                    "prediction": prediction.tolist() if hasattr(prediction, "tolist") else str(prediction),
                    "data_state": "PREDICTED"
                }
            except Exception as e:
                logger.warning(f"Inference failed on {filename}: {e}")

        if filename and filename in self.loaded_datasets:
            ds_info = self.loaded_datasets[filename]
            if ds_info["type"] == "DATAFRAME":
                df: pd.DataFrame = ds_info["data"]
                idx = step_idx % len(df)
                row = df.iloc[idx].to_dict()
                return {
                    "source": f"PKL_DATAFRAME:{filename}",
                    "step_idx": idx,
                    "telemetry": row,
                    "data_state": "REAL"
                }
            elif ds_info["type"] == "DICTIONARY":
                return {
                    "source": f"PKL_DICT:{filename}",
                    "keys": list(ds_info["data"].keys()),
                    "sample": {k: str(v)[:50] for k, v in list(ds_info["data"].items())[:5]},
                    "data_state": "SIMULATED"
                }

        # Baseline fallback telemetry frame generator
        return {
            "source": "SIMULATION_FALLBACK",
            "pack_voltage": 352.4,
            "pack_current": -14.2,
            "pack_temperature": 32.8,
            "soc": 84.5,
            "soh": 96.2,
            "data_state": "SIMULATED"
        }

# Global Instance
pkl_engine = PKLSimulationEngine(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data")))
