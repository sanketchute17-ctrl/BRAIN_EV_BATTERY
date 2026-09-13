"""
api_interface.py — Backward compatibility wrapper for api.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from api import app

__all__ = ['app']

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
