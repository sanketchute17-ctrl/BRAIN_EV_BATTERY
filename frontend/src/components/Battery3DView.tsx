import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type CasingMode = 'SOLID' | 'TRANSPARENT' | 'X-RAY';
export type FlowMode = 'CHARGING' | 'DISCHARGING' | 'IDLE';
export type HealthStatus = 'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL';

export interface ComponentInfo {
  name: string;
  type: string;
  voltage?: string;
  temp?: string;
  deviation?: string;
  status: string;
  risk: string;
  description: string;
  isSimulated?: boolean;
}

export interface CellData {
  cellId: number;
  voltage: number;
  temperature: number;
  status: HealthStatus;
  deviation?: number;
}

export interface Battery3DViewProps {
  status?: HealthStatus;
  soc?: number;
  soh?: number;
  temperature?: number;
  voltage?: number;
  current?: number;
  power?: number;
  risk?: number;
  expanded?: boolean;
  interactive?: boolean;
  flowMode?: FlowMode;
  isSimulated?: boolean;
  hideControls?: boolean;
  cellData?: CellData[];
  onCellSelect?: (cellId: number) => void;
  onComponentSelect?: (info: ComponentInfo) => void;
  onReset?: () => void;
}

export const Battery3DView: React.FC<Battery3DViewProps> = ({
  status = 'HEALTHY',
  soc = 88,
  soh = 98.2,
  temperature = 32.4,
  voltage = 400.2,
  current = 14.5,
  power = 5.8,
  risk = 2,
  expanded = false,
  interactive = true,
  isSimulated = true,
  hideControls = false,
  cellData,
  onCellSelect,
  onComponentSelect,
  onReset,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [casingMode, setCasingMode] = useState<CasingMode>('TRANSPARENT');
  const [isExploded, setIsExploded] = useState(expanded);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedInfo, setSelectedInfo] = useState<ComponentInfo | null>(null);

  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  // Touch & Mouse Control Refs
  const isDragging = useRef(false);
  const touchStartDist = useRef<number | null>(null);
  const touchStartPan = useRef<{ x: number; y: number } | null>(null);
  const lastTapTime = useRef<number>(0);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const coverMeshRef = useRef<THREE.Mesh | null>(null);
  const coverWireframeRef = useRef<THREE.LineSegments | null>(null);
  const bmsGroupRef = useRef<THREE.Group | null>(null);
  const modulesGroupRef = useRef<THREE.Group | null>(null);
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);

  // Default Camera & Target Angles
  const defaultCamPos = new THREE.Vector3(5.5, 4.0, 6.5);
  const defaultLookAt = new THREE.Vector3(0, 0, 0);

  const targetCamPos = useRef(defaultCamPos.clone());
  const targetLookAt = useRef(defaultLookAt.clone());
  const currentLookAt = useRef(defaultLookAt.clone());

  // Procedural BMS Branding Plate Texture (Strictly "BRAIN": BRAI in White, N in Electric Green)
  const createBrainLogoTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark Graphite Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);

      // Plate Bezel Outline
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, 488, 232);

      // Inner Metallic Trim
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 3;
      ctx.strokeRect(22, 22, 468, 212);

      // Mounting Screws at 4 Corners
      const screws = [[36, 36], [476, 36], [36, 220], [476, 220]];
      screws.forEach(([sx, sy]) => {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // BRAI Text in Crisp Pure White
      ctx.font = '900 110px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 12;
      ctx.fillText('BRAI', 85, 128);

      // N Text in Electric Green (#00E676)
      ctx.fillStyle = '#00E676';
      ctx.shadowColor = '#00E676';
      ctx.shadowBlur = 24;
      ctx.fillText('N', 375, 128);

      // Subtitle Accent Line (No "EV")
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 20px "Inter", "Segoe UI", sans-serif';
      ctx.fillText('SAFETY & TELEMETRY MODULE', 85, 190);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const resetCamera = () => {
    targetCamPos.current.copy(defaultCamPos);
    targetLookAt.current.copy(defaultLookAt);
    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.set(0.25, -0.35, 0);
    }
    rotationVelocity.current = { x: 0, y: 0 };
    setSelectedInfo(null);
    if (selectedMeshRef.current && (selectedMeshRef.current.material as THREE.MeshStandardMaterial).emissive) {
      (selectedMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
      selectedMeshRef.current = null;
    }
    if (onReset) onReset();
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth || 340;
    const height = currentMount.clientHeight || 240;
    const aspect = height > 0 ? width / height : 1.5;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let animId: number;

    try {
      scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = null;

      camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 1000);
      camera.position.copy(targetCamPos.current);
      camera.lookAt(currentLookAt.current);
      cameraRef.current = camera;

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      } catch (e) {
        renderer = new THREE.WebGLRenderer({ alpha: true });
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      try {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } catch (e) {
        // Shadow map fallback
      }
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      rendererRef.current = renderer;

      currentMount.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('WebGL Renderer Init Fallback:', err);
      return;
    }

    const rootGroup = new THREE.Group();
    // Default initial angle: elevated perspective showing front, top & BMS panel
    rootGroup.rotation.set(0.25, -0.35, 0);
    rootGroupRef.current = rootGroup;
    scene.add(rootGroup);

    // Color definitions based on status
    let primaryGlowHex = 0x00e676; // Healthy Electric Green
    if (status === 'WATCH') primaryGlowHex = 0xf59e0b;
    if (status === 'WARNING') primaryGlowHex = 0xf97316;
    if (status === 'CRITICAL') primaryGlowHex = 0xef4444;

    // STUDIO LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.6);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 4.0);
    mainKeyLight.position.set(12, 18, 14);
    mainKeyLight.castShadow = true;
    scene.add(mainKeyLight);

    const fillBlueLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    fillBlueLight.position.set(-14, 12, -10);
    scene.add(fillBlueLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 3.5);
    rimLight.position.set(0, 12, -14);
    scene.add(rimLight);

    const cellInternalGlowLight = new THREE.PointLight(primaryGlowHex, 5.5, 10);
    cellInternalGlowLight.position.set(0, 0.4, 0);
    rootGroup.add(cellInternalGlowLight);

    const groundGlowLight = new THREE.PointLight(0x00e676, 2.5, 7);
    groundGlowLight.position.set(0, -1.6, 0);
    rootGroup.add(groundGlowLight);

    // REALISTIC EV BATTERY PACK DIMENSIONS (LOW PROFILE SKATEBOARD DECK)
    const packWidth = 7.6; // X axis
    const packHeight = 1.35; // Y axis (low profile height)
    const packDepth = 4.2; // Z axis

    // 1. ALUMINUM LOWER STRUCTURAL TRAY & CHASSIS
    const chassisGeo = new THREE.BoxGeometry(packWidth, 0.22, packDepth);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = -0.75;
    chassisMesh.userData = {
      name: 'Aluminum Chassis Tray',
      type: 'Structural Base Frame',
      voltage: `${voltage} V`,
      temp: `${temperature} °C`,
      status: 'HEALTHY',
      risk: `${risk}%`,
      description: 'Extruded aluminum bottom tray protecting battery modules against road impacts and water intrusion.',
    };
    rootGroup.add(chassisMesh);

    // Structural Internal Rail Dividers (Longitudinal & Transverse Extrusions)
    const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    
    // Transverse Center Rail
    const transRailGeo = new THREE.BoxGeometry(0.18, 0.8, packDepth - 0.4);
    const transRail = new THREE.Mesh(transRailGeo, railMat);
    transRail.position.set(0, -0.3, 0);
    rootGroup.add(transRail);

    // Longitudinal Center Divider
    const longRailGeo = new THREE.BoxGeometry(packWidth - 0.4, 0.8, 0.18);
    const longRail = new THREE.Mesh(longRailGeo, railMat);
    longRail.position.set(0, -0.3, 0);
    rootGroup.add(longRail);

    // Corner Mounting Flanges & Steel Hex Bolts
    const boltGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.1 });
    
    [-3.5, -1.8, 0, 1.8, 3.5].forEach((bx) => {
      [-1.9, 1.9].forEach((bz) => {
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.position.set(bx, -0.62, bz);
        rootGroup.add(bolt);
      });
    });

    // 2. INTEGRATED LIQUID COOLING COLD-PLATE & BLUE COOLANT PIPES
    const coolingPlateGeo = new THREE.BoxGeometry(packWidth - 0.4, 0.08, packDepth - 0.4);
    const coolingPlateMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
    });
    const coolingPlate = new THREE.Mesh(coolingPlateGeo, coolingPlateMat);
    coolingPlate.position.y = -0.62;
    coolingPlate.userData = {
      name: 'Bottom Liquid Cooling Cold-Plate',
      type: 'Thermal Management System',
      temp: `${temperature} °C`,
      status: 'OPTIMAL',
      risk: '0%',
      description: 'Micro-channel cold plate routing liquid ethylene glycol to extract thermal energy during high C-rate discharge.',
    };
    rootGroup.add(coolingPlate);

    // Curved Coolant Inlet & Outlet Hoses (Vibrant Cyan / Blue Pipes)
    const createCoolantPipe = (points: THREE.Vector3[], radius = 0.065) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, radius, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        roughness: 0.15,
        metalness: 0.4,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
      });
      return new THREE.Mesh(tubeGeo, tubeMat);
    };

    // Front Cooling Loop Pipe 1
    const coolantPipe1 = createCoolantPipe([
      new THREE.Vector3(-3.6, -0.55, 1.85),
      new THREE.Vector3(-1.5, -0.55, 1.85),
      new THREE.Vector3(1.5, -0.55, 1.85),
      new THREE.Vector3(3.4, -0.55, 1.6),
    ]);
    coolantPipe1.userData = {
      name: 'Coolant Supply Manifold Pipe',
      type: 'Liquid Cooling Hose',
      temp: `${temperature - 2.0} °C`,
      status: 'ACTIVE',
      risk: '0%',
      description: 'High-pressure reinforced blue coolant pipe circulating chilled liquid along battery module bases.',
    };
    rootGroup.add(coolantPipe1);

    // Rear Coolant Return Loop Pipe 2
    const coolantPipe2 = createCoolantPipe([
      new THREE.Vector3(-3.6, -0.55, -1.85),
      new THREE.Vector3(-1.5, -0.55, -1.85),
      new THREE.Vector3(1.5, -0.55, -1.85),
      new THREE.Vector3(3.4, -0.55, -1.6),
    ]);
    rootGroup.add(coolantPipe2);

    // 3. REUSABLE INSTANCED LITHIUM CELL MODULES (4 MODULES IN 2x2 GRID)
    const modulesGroup = new THREE.Group();
    modulesGroupRef.current = modulesGroup;
    rootGroup.add(modulesGroup);

    const modWidth = 3.2; // X
    const modHeight = 0.75; // Y
    const modDepth = 1.6; // Z

    const modPositions = [
      { x: -1.8, z: 1.0, label: 'Module M1 (Front Left)' },
      { x: 1.8, z: 1.0, label: 'Module M2 (Front Right)' },
      { x: -1.8, z: -1.0, label: 'Module M3 (Rear Left)' },
      { x: 1.8, z: -1.0, label: 'Module M4 (Rear Right)' },
    ];

    // High performance InstancedMesh for 128 cylindrical 21700 cells across all modules
    const numCellsPerMod = 32; // 4 rows x 8 columns
    const totalCells = modPositions.length * numCellsPerMod;

    const cellRadius = 0.14;
    const cellHeight = 0.65;
    const cellCylinderGeo = new THREE.CylinderGeometry(cellRadius, cellRadius, cellHeight, 16);
    const cellCanMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });

    const cellInstancedMesh = new THREE.InstancedMesh(cellCylinderGeo, cellCanMat, totalCells);
    cellInstancedMesh.castShadow = true;
    cellInstancedMesh.receiveShadow = true;

    // Glowing Top Caps InstancedMesh
    const capGeo = new THREE.CylinderGeometry(cellRadius * 0.7, cellRadius * 0.7, 0.05, 16);
    const capGlowMat = new THREE.MeshStandardMaterial({
      color: primaryGlowHex,
      emissive: primaryGlowHex,
      emissiveIntensity: 2.0,
      metalness: 0.3,
      roughness: 0.1,
    });
    const capInstancedMesh = new THREE.InstancedMesh(capGeo, capGlowMat, totalCells);

    const dummyMatrix = new THREE.Matrix4();
    let globalCellIdx = 0;

    modPositions.forEach((modPos, modIdx) => {
      // Dark Module Enclosure Frame
      const modFrameGeo = new THREE.BoxGeometry(modWidth, modHeight, modDepth);
      const modFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
      const modFrame = new THREE.Mesh(modFrameGeo, modFrameMat);
      modFrame.position.set(modPos.x, -0.28, modPos.z);
      modFrame.userData = {
        name: modPos.label,
        type: 'Lithium Battery Module',
        voltage: `${(voltage / 4).toFixed(1)} V`,
        temp: `${temperature} °C`,
        status: status,
        risk: `${risk}%`,
        description: `High energy density module housing 32 cylindrical lithium-ion 21700 cells in parallel/series.`,
      };
      modulesGroup.add(modFrame);

      // Top Module Protection Cover Plate
      const modTopGeo = new THREE.BoxGeometry(modWidth - 0.1, 0.05, modDepth - 0.1);
      const modTopMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.5 });
      const modTop = new THREE.Mesh(modTopGeo, modTopMat);
      modTop.position.set(modPos.x, 0.12, modPos.z);
      modulesGroup.add(modTop);

      // Metallic Nickel Busbar Connector Strips on Top of Cells
      const busbarGeo = new THREE.BoxGeometry(modWidth - 0.3, 0.03, 0.08);
      const busbarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

      [-0.4, 0.0, 0.4].forEach((bzOffset) => {
        const busbar = new THREE.Mesh(busbarGeo, busbarMat);
        busbar.position.set(modPos.x, 0.16, modPos.z + bzOffset);
        modulesGroup.add(busbar);
      });

      // Populate Instanced Cells (4 rows x 8 cols)
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          const cx = modPos.x - 1.25 + c * 0.36;
          const cz = modPos.z - 0.52 + r * 0.35;
          const cy = -0.25;

          // Cell Can Matrix
          dummyMatrix.setPosition(cx, cy, cz);
          cellInstancedMesh.setMatrixAt(globalCellIdx, dummyMatrix);

          // Cell Glowing Cap Matrix
          dummyMatrix.setPosition(cx, cy + cellHeight / 2 + 0.02, cz);
          capInstancedMesh.setMatrixAt(globalCellIdx, dummyMatrix);

          globalCellIdx++;
        }
      }
    });

    cellInstancedMesh.instanceMatrix.needsUpdate = true;
    capInstancedMesh.instanceMatrix.needsUpdate = true;
    modulesGroup.add(cellInstancedMesh);
    modulesGroup.add(capInstancedMesh);

    // 4. REALISTIC BMS MASTER ENCLOSURE & DETAILED ELECTRONICS CIRCUIT BOARD
    const bmsGroup = new THREE.Group();
    bmsGroup.position.set(3.4, 0.35, 0.0);
    bmsGroupRef.current = bmsGroup;
    rootGroup.add(bmsGroup);

    // BMS Outer Graphite Housing Enclosure
    const bmsBoxGeo = new THREE.BoxGeometry(1.2, 0.85, 2.4);
    const bmsBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.85 });
    const bmsBox = new THREE.Mesh(bmsBoxGeo, bmsBoxMat);
    bmsBox.userData = {
      name: 'BMS Primary Controller Housing',
      type: 'Master Battery Management System',
      voltage: `${voltage} V`,
      temp: `${temperature - 1.5} °C`,
      status: 'ONLINE',
      risk: '0%',
      description: 'Houses main dual-core microcontroller, PINN AI thermal inference engine & CAN-bus communication transceiver.',
    };
    bmsGroup.add(bmsBox);

    // Green Multilayer PCB Circuit Board visible on side
    const pcbGeo = new THREE.BoxGeometry(0.08, 0.7, 2.1);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3, metalness: 0.3 });
    const pcbBoard = new THREE.Mesh(pcbGeo, pcbMat);
    pcbBoard.position.set(-0.58, 0, 0);
    pcbBoard.userData = {
      name: 'BMS Safety Intelligence PCB',
      type: 'Electronics Control Board',
      status: 'ACTIVE',
      risk: '0%',
      description: 'Multilayer PCB with isolated ADC voltage sensing chips, solid-state relays and telemetry sensors.',
    };
    bmsGroup.add(pcbBoard);

    // Microchips & SMT Capacitors on PCB
    const icGeo = new THREE.BoxGeometry(0.1, 0.25, 0.35);
    const icMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.9, roughness: 0.1 });
    const mainIC = new THREE.Mesh(icGeo, icMat);
    mainIC.position.set(-0.52, 0.1, 0.3);
    bmsGroup.add(mainIC);

    const bmsCapGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12);
    const bmsCapMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    [-0.5, -0.2, 0.1, 0.5].forEach((cz) => {
      const cap = new THREE.Mesh(bmsCapGeo, bmsCapMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(-0.52, -0.2, cz);
      bmsGroup.add(cap);
    });

    // BRAIN BRANDING PLATE ON BMS SIDE PANEL (BRAI in Pure White, N in Electric Green)
    const logoTexture = createBrainLogoTexture();
    const logoPlateGeo = new THREE.BoxGeometry(0.06, 0.65, 1.8);
    const logoPlateMat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      metalness: 0.4,
      roughness: 0.15,
      emissive: 0xffffff,
      emissiveMap: logoTexture,
      emissiveIntensity: 0.35,
    });
    const logoPlate = new THREE.Mesh(logoPlateGeo, logoPlateMat);
    logoPlate.position.set(0.61, 0.05, 0.0);
    logoPlate.userData = {
      name: 'BRAIN Master Telemetry Plate',
      type: 'BMS Controller Panel',
      status: 'ONLINE',
      risk: '0%',
      description: 'BRAIN Master Unit housing real-time risk telemetry & PINN AI algorithms.',
    };
    bmsGroup.add(logoPlate);

    // 5. ORANGE HIGH-VOLTAGE (HV) HEAVY POWER CABLES & HV CONNECTORS
    const createCurvedHVCable = (points: THREE.Vector3[], radius = 0.09) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 36, radius, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xff5500, // Vibrant Orange
        roughness: 0.25,
        metalness: 0.3,
      });
      return new THREE.Mesh(tubeGeo, tubeMat);
    };

    // Positive & Negative Orange HV Power Bus Cables Routing to BMS
    const hvCablePos = createCurvedHVCable([
      new THREE.Vector3(-3.2, 0.0, 0.8),
      new THREE.Vector3(-1.0, 0.35, 0.8),
      new THREE.Vector3(1.2, 0.35, 0.6),
      new THREE.Vector3(2.8, 0.35, 0.4),
    ]);
    hvCablePos.userData = {
      name: 'HV Positive Heavy Power Bus Cable',
      type: 'High-Voltage Power Cable',
      voltage: `${voltage} V`,
      temp: `${temperature + 1.2} °C`,
      status: 'HEALTHY',
      risk: '0%',
      description: 'Heavy gauge orange double-insulated copper cable connecting positive module string to main relay.',
    };
    rootGroup.add(hvCablePos);

    const hvCableNeg = createCurvedHVCable([
      new THREE.Vector3(-3.2, 0.0, -0.8),
      new THREE.Vector3(-1.0, 0.35, -0.8),
      new THREE.Vector3(1.2, 0.35, -0.6),
      new THREE.Vector3(2.8, 0.35, -0.4),
    ]);
    hvCableNeg.userData = {
      name: 'HV Negative Heavy Power Bus Cable',
      type: 'High-Voltage Power Cable',
      voltage: '0 V (Ref Gnd)',
      status: 'HEALTHY',
      risk: '0%',
      description: 'Heavy gauge orange insulated return cable routing power through current shunt sensor.',
    };
    rootGroup.add(hvCableNeg);

    // Front Orange HV Service Disconnect Plug & Connectors
    const connectorHousingGeo = new THREE.BoxGeometry(0.35, 0.7, 0.9);
    const connectorHousingMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.3, metalness: 0.4 });
    const connectorHousing = new THREE.Mesh(connectorHousingGeo, connectorHousingMat);
    connectorHousing.position.set(-3.85, 0.0, 0.0);
    connectorHousing.userData = {
      name: 'HV Manual Service Disconnect Plug',
      type: 'HV Safety Connector',
      status: 'LOCKED & ENGAGED',
      risk: '0%',
      description: 'Emergency manual service disconnect plug to break high-voltage circuit during maintenance.',
    };
    rootGroup.add(connectorHousing);

    // 6. OUTER PROTECTIVE TRANSPARENT CASING & CHROME STRUCTURAL PILLARS
    const coverGroup = new THREE.Group();
    coverGroup.position.y = 0.0;
    rootGroup.add(coverGroup);

    const coverGeo = new THREE.BoxGeometry(packWidth + 0.15, packHeight, packDepth + 0.15);
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.28,
    });
    const coverMesh = new THREE.Mesh(coverGeo, coverMat);
    coverMeshRef.current = coverMesh;
    coverGroup.add(coverMesh);

    // Wireframe Outer Contour Edge Lines
    const coverEdges = new THREE.EdgesGeometry(coverGeo);
    const edgeLineMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, linewidth: 2, transparent: true, opacity: 0.4 });
    const coverEdgeLines = new THREE.LineSegments(coverEdges, edgeLineMat);
    coverWireframeRef.current = coverEdgeLines;
    coverGroup.add(coverEdgeLines);

    // Chrome Structural Pillars & Fasteners
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, packHeight, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.6,
    });

    const pillarPositions = [
      [-(packWidth / 2), -(packDepth / 2)],
      [(packWidth / 2), -(packDepth / 2)],
      [-(packWidth / 2), (packDepth / 2)],
      [(packWidth / 2), (packDepth / 2)],
    ];

    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 0, pz);
      coverGroup.add(pillar);
    });

    // RAYCASTING INTERACTION & FULL MOBILE TOUCH / MOUSE CONTROLS
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();

    const handlePointerDown = (clientX: number, clientY: number) => {
      if (!interactive) return;
      isDragging.current = true;
      previousMousePosition.current = { x: clientX, y: clientY };
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!isDragging.current || !rootGroupRef.current) return;
      const deltaX = clientX - previousMousePosition.current.x;
      const deltaY = clientY - previousMousePosition.current.y;
      
      rotationVelocity.current = { x: deltaX * 0.005, y: deltaY * 0.003 };

      // 360° Horizontal rotation, clamped vertical rotation to prevent flipping upside down
      rootGroupRef.current.rotation.y += rotationVelocity.current.x;
      const newRotX = rootGroupRef.current.rotation.x + rotationVelocity.current.y;
      rootGroupRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newRotX));

      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => { setAutoRotate(true); }, 3000);
    };

    const handleCanvasClick = (clientX: number, clientY: number) => {
      if (!interactive || !mountRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mousePos.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mousePos, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && (!hitObj.userData || !hitObj.userData.name) && hitObj.parent && hitObj.parent !== sceneRef.current) {
          hitObj = hitObj.parent;
        }

        if (hitObj && hitObj.userData && hitObj.userData.name) {
          const hitMesh = hitObj as THREE.Mesh;
          if (selectedMeshRef.current && (selectedMeshRef.current.material as THREE.MeshStandardMaterial).emissive) {
            (selectedMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
          }
          selectedMeshRef.current = hitMesh;

          if (hitMesh.material && (hitMesh.material as THREE.MeshStandardMaterial).emissive) {
            (hitMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;
          }

          const worldPos = new THREE.Vector3();
          hitMesh.getWorldPosition(worldPos);
          targetLookAt.current.copy(worldPos);
          targetCamPos.current.set(worldPos.x + 2.5, worldPos.y + 2.5, worldPos.z + 3.8);

          const info: ComponentInfo = {
            name: hitMesh.userData.name,
            type: hitMesh.userData.type || 'Component',
            voltage: hitMesh.userData.voltage,
            temp: hitMesh.userData.temp,
            status: hitMesh.userData.status || 'NORMAL',
            risk: hitMesh.userData.risk || '0%',
            description: hitMesh.userData.description || 'Component under real-time telemetry monitoring.',
            isSimulated,
          };
          setSelectedInfo(info);
          if (onComponentSelect) onComponentSelect(info);
          if (hitMesh.userData.cellId && onCellSelect) onCellSelect(hitMesh.userData.cellId);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => {
      handlePointerUp();
      if (Math.abs(e.clientX - previousMousePosition.current.x) < 4 && Math.abs(e.clientY - previousMousePosition.current.y) < 4) {
        handleCanvasClick(e.clientX, e.clientY);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = e.deltaY * 0.008;
      targetCamPos.current.z = Math.max(3.2, Math.min(14.0, targetCamPos.current.z + zoomFactor));
    };

    // TOUCH EVENTS: 1-Finger Rotate, 2-Finger Pinch Zoom & Pan, Double Tap Reset
    const onTouchStart = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTapTime.current < 280) {
        resetCamera();
        lastTapTime.current = 0;
        return;
      }
      lastTapTime.current = now;

      if (e.touches.length === 1) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        touchStartDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartPan.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2 && touchStartDist.current) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const deltaDist = touchStartDist.current - dist;
        targetCamPos.current.z = Math.max(3.2, Math.min(14.0, targetCamPos.current.z + deltaDist * 0.03));
        touchStartDist.current = dist;

        if (touchStartPan.current) {
          const currentPanX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const currentPanY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const dx = (currentPanX - touchStartPan.current.x) * 0.005;
          const dy = (currentPanY - touchStartPan.current.y) * 0.005;
          targetLookAt.current.x -= dx;
          targetLookAt.current.y += dy;
          touchStartPan.current = { x: currentPanX, y: currentPanY };
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      handlePointerUp();
      if (e.changedTouches.length === 1 && touchStartDist.current === null) {
        handleCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      touchStartDist.current = null;
      touchStartPan.current = null;
    };

    currentMount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    currentMount.addEventListener('wheel', onWheel, { passive: false });
    currentMount.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // ANIMATION LOOP (WITH SMOOTH INERTIA & CONTINUOUS SUBTLE SLOW AUTO-ROTATION)
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (rootGroupRef.current) {
        if (!isDragging.current && autoRotateRef.current) {
          if (hideControls) {
            // Smooth subtle floating motion for Login Screen
            rootGroupRef.current.rotation.y = -0.35 + Math.sin(Date.now() * 0.0008) * 0.15;
            rootGroupRef.current.rotation.x = 0.22 + Math.cos(Date.now() * 0.0006) * 0.03;
          } else {
            rootGroupRef.current.rotation.y += 0.0025;
          }
        } else if (!isDragging.current) {
          rootGroupRef.current.rotation.y += rotationVelocity.current.x;
          rootGroupRef.current.rotation.x += rotationVelocity.current.y;
          rootGroupRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rootGroupRef.current.rotation.x));

          rotationVelocity.current.x *= 0.92;
          rotationVelocity.current.y *= 0.92;
        }
      }

      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.08);
        currentLookAt.current.lerp(targetLookAt.current, 0.08);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      if (coverMeshRef.current && coverMeshRef.current.parent) {
        coverMeshRef.current.parent.position.y = THREE.MathUtils.lerp(
          coverMeshRef.current.parent.position.y,
          isExploded ? 2.2 : 0.0,
          0.08
        );
      }
      if (bmsGroupRef.current) {
        bmsGroupRef.current.position.y = THREE.MathUtils.lerp(
          bmsGroupRef.current.position.y,
          isExploded ? 1.4 : 0.35,
          0.08
        );
      }

      cellInternalGlowLight.intensity = 4.5 + Math.sin(Date.now() * 0.004) * 1.2;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      currentMount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      currentMount.removeEventListener('wheel', onWheel);
      currentMount.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [status, isExploded, interactive, voltage, temperature, risk]);

  // Casing transparency mode update
  useEffect(() => {
    if (!coverMeshRef.current || !coverWireframeRef.current) return;
    const coverMat = coverMeshRef.current.material as THREE.MeshStandardMaterial;
    const wireMat = coverWireframeRef.current.material as THREE.LineBasicMaterial;

    if (casingMode === 'SOLID') {
      coverMat.opacity = 0.92;
      wireMat.opacity = 0.2;
    } else if (casingMode === 'TRANSPARENT') {
      coverMat.opacity = 0.28;
      wireMat.opacity = 0.4;
    } else if (casingMode === 'X-RAY') {
      coverMat.opacity = 0.08;
      wireMat.opacity = 0.95;
    }
  }, [casingMode]);

  return (
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[300px] flex items-center justify-center select-none bg-transparent border-0 shadow-none overflow-visible">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP CONTROLS BAR (SOLID / TRANSPARENT / X-RAY + ASSEMBLE / EXPLODE) */}
      {!hideControls && (
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 p-1.5 rounded-xl backdrop-blur-md shadow-lg">
            {(['SOLID', 'TRANSPARENT', 'X-RAY'] as CasingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setCasingMode(mode)}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                  casingMode === mode
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExploded(!isExploded)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border backdrop-blur-md transition cursor-pointer ${
                isExploded
                  ? 'bg-red-500 text-white border-red-400'
                  : 'bg-slate-900/90 text-emerald-400 border-emerald-500/50 hover:bg-slate-800'
              }`}
            >
              {isExploded ? 'ASSEMBLE' : 'EXPLODED VIEW'}
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border backdrop-blur-md transition cursor-pointer ${
                autoRotate
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700'
              }`}
            >
              AUTO ROTATE ↻
            </button>

            <button
              onClick={resetCamera}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-slate-900/90 text-white border border-slate-700 hover:bg-slate-800 cursor-pointer"
            >
              RESET ↺
            </button>
          </div>
        </div>
      )}

      {/* SELECTED COMPONENT TELEMETRY POPUP */}
      {selectedInfo && (
        <div className="absolute bottom-12 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs z-30 bg-slate-900/95 text-white border-2 border-[#00E676] p-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-fadeIn space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <div>
              <span className="text-[10px] font-extrabold text-[#00E676] uppercase tracking-wider">
                {selectedInfo.type}
              </span>
              <h4 className="text-sm font-black text-white uppercase">{selectedInfo.name}</h4>
            </div>
            <button
              onClick={() => setSelectedInfo(null)}
              className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono font-bold">
            <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700">
              <div className="text-[9px] text-slate-400 uppercase">VOLTAGE</div>
              <div className="text-xs text-[#00E676] font-extrabold mt-0.5">{selectedInfo.voltage || '3.65 V'}</div>
            </div>
            <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700">
              <div className="text-[9px] text-slate-400 uppercase">TEMPERATURE</div>
              <div className="text-xs text-amber-400 font-extrabold mt-0.5">{selectedInfo.temp || `${temperature} °C`}</div>
            </div>
          </div>

          <p className="text-[11px] font-medium text-slate-300 leading-snug">{selectedInfo.description}</p>
        </div>
      )}

      {/* FOOTER GESTURE HINT & SYSTEM STATE */}
      {!hideControls && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none text-xs font-mono font-bold">
          <span className="bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700 backdrop-blur-md shadow-md">
            1-Finger Rotate • Pinch Zoom • Tap for Telemetry
          </span>
          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 px-2.5 py-1 rounded-xl font-extrabold shadow-sm">
            {isSimulated ? 'BRAIN DIGITAL TWIN' : 'BLE BMS HARDWARE'}
          </span>
        </div>
      )}
    </div>
  );
};

// Re-export as InteractiveBattery3D for global architecture compliance
export const InteractiveBattery3D = Battery3DView;

export default Battery3DView;
