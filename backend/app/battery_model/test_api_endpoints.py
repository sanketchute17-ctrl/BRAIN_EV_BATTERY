"""
test_api_endpoints.py — REST API Endpoint Verification
======================================================
Tests all required mobile application endpoints:
  - GET  /battery/telemetry
  - GET  /battery/cells
  - POST /battery/fault
  - GET  /battery/status
"""

import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'communication'))
from api import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_all_endpoints():
    print("=" * 60)
    print("  TESTING FASTAPI MOBILE REST ENDPOINTS")
    print("=" * 60)

    # 1. Health check
    res = client.get("/")
    print(f"\n1. GET / -> Status {res.status_code}")
    assert res.status_code == 200

    # 2. Telemetry
    res = client.get("/battery/telemetry")
    print(f"\n2. GET /battery/telemetry -> Status {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200
    data = res.json()
    assert 'time' in data
    assert 'battery_id' in data
    assert 'cells' in data

    # 3. Cells
    res = client.get("/battery/cells")
    print(f"\n3. GET /battery/cells -> Status {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 4. Inject Fault
    res = client.post("/battery/fault", json={"fault": "cell_degradation", "cell_id": 5, "active": True})
    print(f"\n4. POST /battery/fault -> Status {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200

    # 5. Status
    res = client.get("/battery/status")
    print(f"\n5. GET /battery/status -> Status {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    assert res.status_code == 200
    status_data = res.json()
    assert 'health_soh_percent' in status_data
    assert 'max_temperature_C' in status_data
    assert 'fault_state' in status_data
    assert 'cycle_count' in status_data

    print("\n" + "=" * 60)
    print("  ALL API ENDPOINTS TESTED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    test_all_endpoints()
