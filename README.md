# ⚡ BRAIN EV BATTERY — PINN & Web Bluetooth BLE BMS Intelligence Platform

[![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg?logo=three.js)](https://threejs.org/)
[![Web Bluetooth](https://img.shields.io/badge/Web_Bluetooth-GATT-blueviolet.svg)](https://web.dev/bluetooth/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black.svg?logo=vercel)](https://frontend-three-pi-88.vercel.app/)

> **BRAIN EV BATTERY** is a Physics-Informed Neural Network (PINN) and Web Bluetooth BLE BMS digital twin intelligence platform designed exclusively for Electric Scooters. It enables real-time 3D battery telemetry visualizer, 8-cell LFP pack monitoring, predictive thermal stress simulation, and Explainable AI (XAI) risk diagnostic analytics.

---

## 🔗 Live Links & Repository

- 🌐 **Live Web Application**: [https://frontend-three-pi-88.vercel.app/](https://frontend-three-pi-88.vercel.app/)
- 📦 **GitHub Repository**: [https://github.com/sanketchute17-ctrl/BRAIN_EV_BATTERY](https://github.com/sanketchute17-ctrl/BRAIN_EV_BATTERY)

---

## 🌟 Key Features

### 🔋 1. Live Web Bluetooth (BLE) GATT BMS Telemetry
- **Physical BLE Hardware Integration**: Real-time pairing and packet streaming from 8-cell/16-cell LFP BMS hardware via standard GATT services.
- **Virtual GATT Peripheral**: Built-in BLE simulator mode for offline development and testing.
- **Zero-State Offline Protection**: When BLE is disconnected, all dashboards strictly display `0.0V`, `0.0A`, `--°C`, `0% SOH`, and `STANDBY` status to prevent false/misleading telemetry.

### 🧊 2. 3D Digital Twin Battery Visualizer (WebGL / Three.js)
- Interactive 3D mesh rendering of EV Scooter battery pack modules.
- Dynamic thermal gradient heatmap highlighting overheating cells in real-time.
- Supports pinch-to-zoom, 360° rotation, and real-time mesh inspection.

### 🧠 3. Physics-Informed Neural Network (PINN) Engine
- Computes electro-thermal degradation, internal resistance growth ($m\Omega$), and cell voltage imbalance ($\Delta V$).
- Calculates dynamic State of Health (SOH %) based on real cycle counts and thermal stress history.
- **Explainable AI (XAI)** feature attribution breakdown explaining why battery risk score changes.

### 🧪 4. Hardware-Gated "What-If" Predictive Simulator
- Calibrated for EV Scooter loads (auxiliary load default: $0.3\text{ kW}$).
- Strictly gated on active BLE connection (`connectionState === 'CONNECTED'`) to ingest live telemetry as the physical baseline.
- Predicts temperature rise, SOC drain rate, thermal stress risk score, and safe operating time window under high speed ($0-100\text{ km/h}$), ambient temperature ($-10\text{ to }55^\circ\text{C}$), and fast charging modes.

### 🛵 5. Tailored EV Scooter Architecture Profiles
Supports specs across all major Indian EV Scooter platforms:
- **Ola S1 Pro**: `70V Nominal • 19S Cell Architecture (~4.0 kWh)`
- **Ather 450X**: `51.1V Nominal • 14S Cell Architecture (~3.7 kWh)`
- **TVS iQube**: `52V Nominal • 14S Cell Architecture (~3.04 kWh)`
- **Bajaj Chetak / Hero Vida**: `50.4V Nominal • 14S Cell Architecture (~2.9 kWh)`
- **Simple One**: `51.2V Nominal • 16S Cell Architecture (~5.0 kWh)`
- **Custom EV Scooter**: Manual text entry fallback with auto-scaling physics parameters.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology Used |
| :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript + Vite |
| **Styling & UI** | Tailwind CSS + Lucide Icons + Inter & Monospace Tech Typography |
| **3D Engine** | Three.js / WebGL Canvas |
| **BLE Protocol** | Web Bluetooth GATT API (`BRAIN-` prefix filters & custom GATT chars) |
| **Physics Loss Engine** | PINN Physics Model (`pinnEngine.ts`) |
| **Backend & Cloud Auth** | Firebase Cloud Auth, Supabase DB, FastAPI Python Backend |
| **Deployment** | Vercel (`vercel.json`) |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js `v18+` or `v20+`
- Google Chrome, Edge, or Android Web View (for Web Bluetooth API support)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sanketchute17-ctrl/BRAIN_EV_BATTERY.git
   cd BRAIN_EV_BATTERY
   ```

2. **Navigate to the frontend directory & install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

3. **Start the local Vite development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📁 Repository Structure

```
BRAIN_EV_BATTERY/
├── frontend/
│   ├── src/
│   │   ├── components/        # 3D Battery Mesh, Drawers, Navigation, Modals
│   │   ├── screens/           # Login, Register, Profile Screens
│   │   ├── services/          # BLE GATT Service, PINN Engine, Firebase Sync, API
│   │   ├── types/             # Telemetry & Normalized Battery Types
│   │   ├── App.tsx            # Main Android Mobile Smartphone App Shell
│   │   └── main.tsx           # Application Entrypoint
│   ├── package.json
│   └── vite.config.ts
├── backend/                   # FastAPI Python Analytics Backend & Datasets
├── vercel.json                # Vercel Production Build & Routing Spec
└── README.md
```

---

## 📄 License & Attribution

Developed with ❤️ for EV Scooter Battery Safety, Diagnostics, and PINN Intelligence.

- **GitHub Repository**: [sanketchute17-ctrl/BRAIN_EV_BATTERY](https://github.com/sanketchute17-ctrl/BRAIN_EV_BATTERY)
- **Live Demo**: [frontend-three-pi-88.vercel.app](https://frontend-three-pi-88.vercel.app/)
