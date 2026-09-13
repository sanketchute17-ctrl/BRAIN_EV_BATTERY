"""
ble_receiver.py — BLE Test Receiver Client Interface
=====================================================
Battery Digital Twin | Communication Layer

Connects to simulated BLE device 'BRAIN_BATTERY_BMS', receives continuous BLE packets,
and displays live BMS telemetry:
  - Voltage (V)
  - Current (A)
  - Temperature (°C)
  - Cycle count
"""

import socket
import json
import sys

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 9123

def run_ble_receiver(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, max_packets: int = 10):
    print("=" * 60)
    print("  BLE TEST RECEIVER — Listening for 'BRAIN_BATTERY_BMS'")
    print("=" * 60)

    try:
        client_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client_sock.connect((host, port))
        print(f"[BLE_RECEIVER] Connected to BLE Device 'BRAIN_BATTERY_BMS' at {host}:{port}\n")
    except Exception as e:
        print(f"[BLE_RECEIVER] Failed to connect: {e}")
        print("Ensure packet_transmitter.py is running!")
        return

    buffer = ""
    received_count = 0

    try:
        while received_count < max_packets:
            data = client_sock.recv(4096).decode('utf-8')
            if not data:
                print("\n[BLE_RECEIVER] Connection Lost")
                break

            buffer += data
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                if not line.strip():
                    continue

                try:
                    pkt = json.loads(line)
                    received_count += 1

                    print("-" * 45)
                    print(f" Received Packet #{pkt.get('sequence_id', received_count)} | Device: {pkt.get('battery_id', 'BRAIN001')}")
                    print("-" * 45)
                    print(f"   Voltage    : {pkt.get('pack', {}).get('voltage', 0.0)} V")
                    print(f"   Current    : {pkt.get('pack', {}).get('current', 0.0)} A")
                    print(f"   Power      : {pkt.get('pack', {}).get('power', 0.0)} W")
                    print(f"   Temperature: {pkt.get('thermal', {}).get('max_temperature', 0.0)} °C")
                    print(f"   Cycle      : {pkt.get('pack', {}).get('cycle_number', 0)}")
                    print(f"   SOH        : {pkt.get('aging', {}).get('soh', 0.0)} %")
                    print(f"   Fault      : {pkt.get('fault', {}).get('status', 'NORMAL')} ({pkt.get('fault', {}).get('type', 'NONE')})")
                    print("-" * 45 + "\n")
                except json.JSONDecodeError:
                    pass
    except KeyboardInterrupt:
        print("\n[BLE_RECEIVER] Disconnected by user.")
    finally:
        client_sock.close()
        print(f"[BLE_RECEIVER] Session finished. Total packets received: {received_count}")

if __name__ == '__main__':
    max_p = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    run_ble_receiver(max_packets=max_p)
