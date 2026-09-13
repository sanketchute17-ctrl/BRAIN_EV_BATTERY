"""
ble_server.py — Simulated Bluetooth Low Energy (BLE) Server
===========================================================
Battery Digital Twin | Communication Layer

Simulates a physical EV Battery BMS Bluetooth BLE GATT device:
  - Device Name: BRAIN_BATTERY_BMS
  - Service UUID: 0x180F (Battery Service)
  - Characteristic UUID: 0x2A19 (BMS Telemetry Stream)
  - TCP/Socket server simulation layer for local IPC and wireless test receivers.
  - Broadcasts continuous telemetry packets.
  - Handles client connections and emits 'CONNECTION_LOST' error state on disconnect.
"""

import socket
import threading
import json
import time

DEVICE_NAME = "BRAIN_BATTERY_BMS"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 9123

class BLEServer:
    """Simulated BLE Server broadcasting BMS telemetry packets to connected receivers."""

    def __init__(self, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, device_name: str = DEVICE_NAME):
        self.host = host
        self.port = port
        self.device_name = device_name
        self.server_socket = None
        self.clients = []
        self.is_running = False
        self.lock = threading.Lock()

    @property
    def connection_state(self) -> str:
        return "TRANSMITTING" if self.clients else ("ADVERTISING" if self.is_running else "DISCONNECTED")

    def transmit_packet(self, telemetry_packet: dict) -> dict:
        if not self.is_running:
            self.start()
        return self.broadcast(telemetry_packet)

    def start(self):
        """Start simulated BLE GATT server socket."""
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(5)
        self.is_running = True

        print(f"[BLE_SERVER] Advertising as '{self.device_name}' on {self.host}:{self.port}")
        threading.Thread(target=self._accept_clients, daemon=True).start()

    def _accept_clients(self):
        while self.is_running:
            try:
                client_sock, addr = self.server_socket.accept()
                with self.lock:
                    self.clients.append(client_sock)
                print(f"[BLE_SERVER] Connected to BLE Receiver: {addr}")
            except Exception:
                break

    def broadcast(self, telemetry_packet: dict) -> dict:
        """Broadcast a JSON telemetry packet to all connected BLE receivers."""
        if not self.is_running:
            return {'success': False, 'error': 'SERVER_NOT_RUNNING'}

        payload = (json.dumps(telemetry_packet) + "\n").encode('utf-8')
        disconnected = []

        with self.lock:
            if not self.clients:
                # No active receiver connected
                return {'success': True, 'receivers_count': 0, 'status': 'ADVERTISING'}

            for client in self.clients:
                try:
                    client.sendall(payload)
                except (socket.error, BrokenPipeError):
                    disconnected.append(client)

            for client in disconnected:
                self.clients.remove(client)
                print(f"[BLE_SERVER] Connection Lost with client socket. Generated: CONNECTION_LOST")

        return {
            'success': True,
            'receivers_count': len(self.clients),
            'bytes_sent': len(payload),
            'status': 'TRANSMITTING' if self.clients else 'ADVERTISING'
        }

    def stop(self):
        self.is_running = False
        with self.lock:
            for client in self.clients:
                try:
                    client.close()
                except Exception:
                    pass
            self.clients.clear()

        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception:
                pass
        print(f"[BLE_SERVER] Stopped BLE Server '{self.device_name}'.")
