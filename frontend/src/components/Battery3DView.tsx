import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type CasingMode = 'SOLID' | 'TRANSPARENT' | 'X-RAY';
export type FlowMode = 'CHARGING' | 'DISCHARGING' | 'IDLE';

interface ComponentInfo {
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

interface Battery3DViewProps {
  status?: 'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  expanded?: boolean;
  interactive?: boolean;
  flowMode?: FlowMode;
  isSimulated?: boolean;
  hideControls?: boolean;
  onCellSelect?: (cellId: number) => void;
  onReset?: () => void;
}

export const Battery3DView: React.FC<Battery3DViewProps> = ({
  status = 'HEALTHY',
  expanded = false,
  interactive = true,
  isSimulated = true,
  hideControls = false,
  onCellSelect,
  onReset,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [casingMode, setCasingMode] = useState<CasingMode>('TRANSPARENT');
  const [isExploded, setIsExploded] = useState(expanded);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedInfo, setSelectedInfo] = useState<ComponentInfo | null>(null);

  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const isDragging = useRef(false);
  const touchStartDist = useRef<number | null>(null);
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
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);

  // Medium Viewing Camera Position
  const targetCamPos = useRef(new THREE.Vector3(0, 4.8, 10.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.1, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.1, 0));

  // Procedural Side Controller Plate Texture (BRAI in Crisp White, N in Glowing Electric Green)
  const createBrainLogoTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark Metallic Black Plate
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);

      // Plate Metallic Bezel Edge
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 492, 236);

      // Corner Mounting Screws
      const screws = [
        [28, 28],
        [484, 28],
        [28, 228],
        [484, 228],
      ];
      screws.forEach(([sx, sy]) => {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // BRAI text in Crisp White
      ctx.font = '900 120px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('BRAI', 65, 130);

      // N text in Glowing Electric Green (#00E676)
      ctx.fillStyle = '#00E676';
      ctx.shadowColor = '#00E676';
      ctx.shadowBlur = 22;
      ctx.fillText('N', 380, 130);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const resetCamera = () => {
    targetCamPos.current.set(0, 4.8, 10.5);
    targetLookAt.current.set(0, 0.1, 0);
    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.set(0.28, 0.08, 0); // Directly facing front BRAIN logo plate
    }
    rotationVelocity.current = { x: 0, y: 0 };
    setSelectedInfo(null);
    if (selectedMeshRef.current && selectedMeshRef.current.material) {
      (selectedMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
      selectedMeshRef.current = null;
    }
    if (onReset) onReset();
  };

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth || 320;
    const height = currentMount.clientHeight || 220;
    const aspect = height > 0 ? width / height : 1.5;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let animId: number;

    try {
      scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = null;

      camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 1000);
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
        // Fallback
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
    // Starting angle: Facing the BRAIN logo plate directly at startup
    rootGroup.rotation.set(0.28, 0.08, 0);
    rootGroupRef.current = rootGroup;
    scene.add(rootGroup);

    let cellGlowHex = 0x00e676; // Electric Green for Healthy State
    if (status === 'WATCH') cellGlowHex = 0xf59e0b;
    if (status === 'WARNING') cellGlowHex = 0xf97316;
    if (status === 'CRITICAL') cellGlowHex = 0xef4444;

    // STUDIO LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.8);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    mainKeyLight.position.set(12, 20, 14);
    mainKeyLight.castShadow = true;
    scene.add(mainKeyLight);

    const fillBlueLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    fillBlueLight.position.set(-14, 10, -10);
    scene.add(fillBlueLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 3.2);
    rimLight.position.set(0, 10, -14);
    scene.add(rimLight);

    const cellInternalGlowLight = new THREE.PointLight(cellGlowHex, 6.5, 12);
    cellInternalGlowLight.position.set(0.5, 0.0, 1.2);
    rootGroup.add(cellInternalGlowLight);

    // Subtle cyan/green ground ambient light glow underneath battery
    const groundGlowLight = new THREE.PointLight(0x00e676, 3.0, 8);
    groundGlowLight.position.set(0, -1.8, 0);
    rootGroup.add(groundGlowLight);

    const packWidth = 8.8;
    const packHeight = 2.4;
    const packDepth = 4.4;

    // 1. METALLIC STRUCTURAL FRAME & BOTTOM CHASSIS
    const chassisGeo = new THREE.BoxGeometry(packWidth - 0.2, 0.35, packDepth - 0.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = -1.2;
    chassisMesh.userData = { name: 'Lower Structural Chassis', type: 'Aluminum Chassis', status: 'HEALTHY', risk: '0%', description: 'Heavy-duty high strength alloy bottom tray protecting battery cells.' };
    rootGroup.add(chassisMesh);

    // Bottom Cooling Plate Structure
    const coolingPlateGeo = new THREE.BoxGeometry(packWidth - 0.6, 0.08, packDepth - 0.6);
    const coolingPlateMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.2, emissive: 0x0284c7, emissiveIntensity: 0.2 });
    const coolingPlate = new THREE.Mesh(coolingPlateGeo, coolingPlateMat);
    coolingPlate.position.y = -1.0;
    coolingPlate.userData = { name: 'Integrated Liquid Cooling Plate', type: 'Thermal Management Plate', status: 'ACTIVE', risk: '0%', description: 'Cold-plate heat exchanger channels routing liquid coolant under cells.' };
    rootGroup.add(coolingPlate);

    // Corner Mounting Brackets
    const bracketGeo = new THREE.BoxGeometry(0.5, 0.25, 0.4);
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });

    [-3.4, -1.2, 1.2, 3.4].forEach((bx) => {
      [-2.1, 2.1].forEach((bz) => {
        const bracket = new THREE.Mesh(bracketGeo, bracketMat);
        bracket.position.set(bx, -1.35, bz);
        rootGroup.add(bracket);
      });
    });

    // 2. PRISMATIC LITHIUM-ION BATTERY MODULES / BLADE CELLS (2 ROWS OF 8 CELLS = 16 CELLS)
    const cellWidth = 0.42;
    const cellHeight = 1.95;
    const cellDepth = 1.6;

    const glowingCellGeo = new THREE.BoxGeometry(cellWidth, cellHeight, cellDepth);

    for (let i = 0; i < 8; i++) {
      const cellId = i + 1;
      const cellX = -1.8 + i * 0.52;
      const cellZ = 1.05;

      // Telemetry anomaly check under warning/critical status
      const hasProblem = (status === 'WARNING' || status === 'CRITICAL') && (cellId === 3 || cellId === 6);
      const activeCellGlow = hasProblem ? 0xef4444 : cellGlowHex;

      const glowingCellMat = new THREE.MeshStandardMaterial({
        color: activeCellGlow,
        emissive: activeCellGlow,
        emissiveIntensity: hasProblem ? 3.0 : 2.2,
        metalness: 0.35,
        roughness: 0.1,
      });

      const cellMesh = new THREE.Mesh(glowingCellGeo, glowingCellMat);
      cellMesh.position.set(cellX, -0.02, cellZ);
      cellMesh.userData = {
        cellId,
        name: `Prismatic Blade Cell C0${cellId}`,
        type: 'Lithium Blade Cell',
        voltage: hasProblem ? '2.92 V (Degraded Voltage Drop)' : '3.65 V',
        temp: hasProblem ? '52.4 °C (Elevated Thermal Spike)' : '32.1 °C',
        status: hasProblem ? 'FAULT DETECTED' : 'HEALTHY',
        risk: hasProblem ? '88%' : '2%',
        description: hasProblem
          ? 'Internal impedance spike & localized overheating detected. Active cell balancing active.'
          : 'High energy density blade cell operating within optimal voltage & thermal thresholds.',
      };
      rootGroup.add(cellMesh);

      // Top White LED Indicator Stripe
      const neonBarGeo = new THREE.BoxGeometry(0.06, cellHeight - 0.1, 0.06);
      const neonBarMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const neonBar = new THREE.Mesh(neonBarGeo, neonBarMat);
      neonBar.position.set(cellX, -0.02, cellZ + 0.81);
      rootGroup.add(neonBar);

      // Electrical Busbar Connectors
      const busbarGeo = new THREE.BoxGeometry(0.48, 0.06, 0.12);
      const busbarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const busbar = new THREE.Mesh(busbarGeo, busbarMat);
      busbar.position.set(cellX, 0.98, cellZ);
      rootGroup.add(busbar);
    }

    // BACK ROW METALLIC MODULE CELLS
    const darkCellGeo = new THREE.BoxGeometry(cellWidth, cellHeight, cellDepth);
    const darkCellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });

    for (let col = 0; col < 8; col++) {
      const cellId = col + 9;
      const cellX = -1.8 + col * 0.52;
      const cellZ = -1.05;

      const darkCell = new THREE.Mesh(darkCellGeo, darkCellMat);
      darkCell.position.set(cellX, -0.02, cellZ);
      darkCell.userData = {
        cellId,
        name: `Prismatic Module Cell C${cellId}`,
        type: 'Lithium Blade Cell',
        voltage: '3.64 V',
        temp: '31.8 °C',
        status: 'HEALTHY',
        risk: '1%',
        description: 'Rear row prismatic cell block with active voltage telemetry sync.',
      };
      rootGroup.add(darkCell);
    }

    // Cell Separator Plates
    const separatorGeo = new THREE.BoxGeometry(0.04, cellHeight, cellDepth + 0.1);
    const separatorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    for (let s = 0; s < 7; s++) {
      const sepX = -1.54 + s * 0.52;
      const sepFront = new THREE.Mesh(separatorGeo, separatorMat);
      sepFront.position.set(sepX, -0.02, 1.05);
      rootGroup.add(sepFront);

      const sepBack = new THREE.Mesh(separatorGeo, separatorMat);
      sepBack.position.set(sepX, -0.02, -1.05);
      rootGroup.add(sepBack);
    }

    // 3. BMS ENCLOSURE & DETAILED ELECTRONICS PCB BOARD
    const bmsGroup = new THREE.Group();
    bmsGroup.position.set(3.2, 0.9, -0.5);
    bmsGroupRef.current = bmsGroup;
    rootGroup.add(bmsGroup);

    // BMS Enclosure Top Box
    const bmsBoxGeo = new THREE.BoxGeometry(1.6, 0.55, 1.2);
    const bmsBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.85 });
    const bmsBox = new THREE.Mesh(bmsBoxGeo, bmsBoxMat);
    bmsBox.userData = { name: 'BMS Primary Master Enclosure', type: 'Control Unit Box', status: 'ONLINE', risk: '0%', description: 'Houses main BMS processing unit & safety disconnect control logic.' };
    bmsGroup.add(bmsBox);

    // Green PCB Circuit Board Beneath Enclosure
    const pcbGeo = new THREE.BoxGeometry(1.5, 0.08, 1.1);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3, metalness: 0.2 });
    const pcbBoard = new THREE.Mesh(pcbGeo, pcbMat);
    pcbBoard.position.set(0, -0.32, 0);
    pcbBoard.userData = { name: 'BMS Logic PCB Board', type: 'Electronics Board', status: 'ACTIVE', risk: '0%', description: 'Multilayer PCB with microcontrollers, voltage sensing ICs & CAN-bus interface.' };
    bmsGroup.add(pcbBoard);

    // Microchip / IC Capacitors on PCB
    const icGeo = new THREE.BoxGeometry(0.35, 0.08, 0.35);
    const icMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.9, roughness: 0.1 });
    const icChip = new THREE.Mesh(icGeo, icMat);
    icChip.position.set(-0.3, -0.24, 0.2);
    bmsGroup.add(icChip);

    const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    [-0.2, 0.1, 0.4].forEach((cx, idx) => {
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(cx, -0.20, -0.2);
      bmsGroup.add(cap);
    });

    // 4. SIDE CONTROLLER BRANDING PLATE WITH BRAIN LOGO (BRAI White, N Green)
    const logoTexture = createBrainLogoTexture();
    const logoPlateGeo = new THREE.BoxGeometry(2.6, 1.4, 0.08);
    const logoPlateMat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      metalness: 0.4,
      roughness: 0.15,
      emissive: 0xffffff,
      emissiveMap: logoTexture,
      emissiveIntensity: 0.35,
    });
    const logoPlate = new THREE.Mesh(logoPlateGeo, logoPlateMat);
    logoPlate.position.set(0.5, 0.0, 2.21);
    logoPlate.userData = {
      name: 'BRAIN Master Intelligence Module Plate',
      type: 'BMS Controller Panel',
      status: 'ONLINE',
      risk: '0%',
      description: 'BRAIN Master Unit housing real-time risk telemetry & PINN AI algorithms.',
    };
    rootGroup.add(logoPlate);

    // 5. ORANGE HIGH-VOLTAGE (HV) HEAVY POWER CABLES
    const createCurvedHVCable = (points: THREE.Vector3[], radius = 0.10) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 36, radius, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xff5500, // Vibrant HV Orange
        roughness: 0.25,
        metalness: 0.3,
      });
      return new THREE.Mesh(tubeGeo, tubeMat);
    };

    [-0.2, 0.0, 0.2].forEach((offsetZ) => {
      const cablePoints = [
        new THREE.Vector3(-3.8, 0.92, -0.6 + offsetZ),
        new THREE.Vector3(-2.2, 0.92, -0.6 + offsetZ),
        new THREE.Vector3(-0.8, 0.92, -0.6 + offsetZ),
      ];
      const cable = createCurvedHVCable(cablePoints, 0.085);
      cable.userData = { name: 'High-Voltage Heavy Power Cable', type: 'HV Bus Cable', status: 'HEALTHY', risk: '0%', description: 'Flexible insulated orange cable routing high power current from cells to BMS.' };
      rootGroup.add(cable);
    });

    const clampGeo = new THREE.BoxGeometry(0.18, 0.2, 0.7);
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x020617 });
    [-3.0, -1.5].forEach((cx) => {
      const clamp = new THREE.Mesh(clampGeo, clampMat);
      clamp.position.set(cx, 0.98, -0.6);
      rootGroup.add(clamp);
    });

    const bmsCable1 = createCurvedHVCable([
      new THREE.Vector3(1.8, 0.95, -0.6),
      new THREE.Vector3(2.8, 1.05, -0.8),
      new THREE.Vector3(3.5, 1.15, -0.6),
    ]);
    rootGroup.add(bmsCable1);

    const bmsCable2 = createCurvedHVCable([
      new THREE.Vector3(2.0, 0.95, -0.4),
      new THREE.Vector3(3.0, 1.05, -0.5),
      new THREE.Vector3(3.6, 1.15, -0.3),
    ]);
    rootGroup.add(bmsCable2);

    // 6. BLUE COOLANT PIPES & RADIATOR MANIFOLD (PHYSICALLY SEPARATE GEOMETRY)
    const createCoolantPipe = (points: THREE.Vector3[], radius = 0.075) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 30, radius, 10, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Vibrant Electric Blue
        roughness: 0.15,
        metalness: 0.5,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
      });
      return new THREE.Mesh(tubeGeo, tubeMat);
    };

    // Lower Side Rail Coolant Tube
    const coolantTube1 = createCoolantPipe([
      new THREE.Vector3(-4.0, -0.9, 1.9),
      new THREE.Vector3(-1.0, -0.9, 1.9),
      new THREE.Vector3(2.2, -0.9, 1.9),
      new THREE.Vector3(3.8, -0.9, 1.7),
    ]);
    coolantTube1.userData = { name: 'Primary Coolant Inlet Hose', type: 'Liquid Cooling Pipe', status: 'ACTIVE', risk: '0%', description: 'Carries ethylene glycol coolant to bottom cold plate manifold.' };
    rootGroup.add(coolantTube1);

    // Front Heat Exchanger Radiator Pipe Loop
    const coolantLoop = createCoolantPipe([
      new THREE.Vector3(-4.2, -0.9, 1.8),
      new THREE.Vector3(-4.3, 0.1, 1.7),
      new THREE.Vector3(-4.3, 0.7, 1.2),
      new THREE.Vector3(-4.2, 0.8, 0.4),
    ]);
    rootGroup.add(coolantLoop);

    // Front Heat Exchanger / Radiator Assembly
    const radiatorGeo = new THREE.BoxGeometry(0.3, 1.4, 1.4);
    const radiatorMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const radiator = new THREE.Mesh(radiatorGeo, radiatorMat);
    radiator.position.set(-4.2, 0.0, -1.2);
    radiator.userData = { name: 'Front Radiator Heat Exchanger', type: 'Cooling Radiator', status: 'OPTIMAL', risk: '0%', description: 'Exchanges thermal heat from cell coolant loop with ambient air.' };
    rootGroup.add(radiator);

    // 7. FRONT HV CONNECTOR HOUSING & TERMINAL PLUGS
    const connectorHousingGeo = new THREE.BoxGeometry(0.4, 1.1, 1.2);
    const connectorHousingMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.3, metalness: 0.4 });
    const connectorHousing = new THREE.Mesh(connectorHousingGeo, connectorHousingMat);
    connectorHousing.position.set(-4.4, 0.0, 0.0);
    connectorHousing.userData = { name: 'HV Service Plug Connector', type: 'HV Connection', status: 'LOCKED', risk: '0%', description: 'High-voltage manual service disconnect safety plug.' };
    rootGroup.add(connectorHousing);

    const plugGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16);
    const plugMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    [-0.3, 0.3].forEach((pz) => {
      const plug = new THREE.Mesh(plugGeo, plugMat);
      plug.rotation.z = Math.PI / 2;
      plug.position.set(-4.6, 0.0, pz);
      rootGroup.add(plug);
    });

    // 8. TRANSPARENT CASING & CHROME CORNER PILLARS
    const coverGroup = new THREE.Group();
    coverGroup.position.y = 0.0;
    rootGroup.add(coverGroup);

    const coverGeo = new THREE.BoxGeometry(packWidth, packHeight, packDepth);
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.32,
    });
    const coverMesh = new THREE.Mesh(coverGeo, coverMat);
    coverMeshRef.current = coverMesh;
    coverGroup.add(coverMesh);

    const coverEdges = new THREE.EdgesGeometry(coverGeo);
    const edgeLineMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, linewidth: 2, transparent: true, opacity: 0.45 });
    const coverEdgeLines = new THREE.LineSegments(coverEdges, edgeLineMat);
    coverWireframeRef.current = coverEdgeLines;
    coverGroup.add(coverEdgeLines);

    // Chrome Corner Pillars & Bolted Mechanical Fasteners
    const pillarGeo = new THREE.CylinderGeometry(0.38, 0.38, packHeight, 24);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      metalness: 0.85,
    });

    const screwMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.15 });

    [
      [-packWidth / 2, -packDepth / 2],
      [packWidth / 2, -packDepth / 2],
      [-packWidth / 2, packDepth / 2],
      [packWidth / 2, packDepth / 2],
    ].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 0.0, pz);
      coverGroup.add(pillar);

      [-packHeight / 2 + 0.1, packHeight / 2 - 0.1].forEach((py) => {
        const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), screwMat);
        rivet.position.set(px, py, pz);
        coverGroup.add(rivet);
      });
    });

    // INTERACTION RAYCASTING & TOUCH / MOUSE CONTROLS
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
      rootGroupRef.current.rotation.y += rotationVelocity.current.x;
      rootGroupRef.current.rotation.x += rotationVelocity.current.y;
      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => { setAutoRotate(true); }, 2500);
    };

    const handleCanvasClick = (clientX: number, clientY: number) => {
      if (!interactive || !mountRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mousePos.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mousePos, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      if (intersects.length > 0) {
        const hitObj = intersects[0].object as THREE.Mesh;
        if (hitObj.userData && hitObj.userData.name) {
          if (selectedMeshRef.current && selectedMeshRef.current.material) {
            (selectedMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.2;
          }
          selectedMeshRef.current = hitObj;
          if (hitObj.material && (hitObj.material as THREE.MeshStandardMaterial).emissive) {
            (hitObj.material as THREE.MeshStandardMaterial).emissiveIntensity = 3.5;
          }
          const worldPos = new THREE.Vector3();
          hitObj.getWorldPosition(worldPos);
          targetLookAt.current.copy(worldPos);
          targetCamPos.current.set(worldPos.x, worldPos.y + 3.2, worldPos.z + 5.2);
          setSelectedInfo({
            name: hitObj.userData.name,
            type: hitObj.userData.type || 'Component',
            voltage: hitObj.userData.voltage,
            temp: hitObj.userData.temp,
            status: hitObj.userData.status || 'NORMAL',
            risk: hitObj.userData.risk || '0%',
            description: hitObj.userData.description || 'Component under active telemetry monitoring.',
            isSimulated,
          });
          if (hitObj.userData.cellId && onCellSelect) onCellSelect(hitObj.userData.cellId);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => {
      handlePointerUp();
      if (Math.abs(e.clientX - previousMousePosition.current.x) < 3 && Math.abs(e.clientY - previousMousePosition.current.y) < 3) {
        handleCanvasClick(e.clientX, e.clientY);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      targetCamPos.current.z = Math.max(4.2, Math.min(18, targetCamPos.current.z + e.deltaY * 0.01));
    };

    const onTouchStart = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTapTime.current < 300) { resetCamera(); lastTapTime.current = 0; return; }
      lastTapTime.current = now;
      if (e.touches.length === 1) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2) touchStartDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2 && touchStartDist.current && cameraRef.current) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        targetCamPos.current.z = Math.max(4.2, Math.min(18, targetCamPos.current.z + (touchStartDist.current - dist) * 0.05));
        touchStartDist.current = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      handlePointerUp();
      if (e.changedTouches.length === 1 && touchStartDist.current === null) handleCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      touchStartDist.current = null;
    };

    currentMount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    currentMount.addEventListener('wheel', onWheel, { passive: false });
    currentMount.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // ANIMATION LOOP (WITH SLOW CONTINUOUS 0.3 SPEED 360-DEGREE AUTO-ROTATION)
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (rootGroupRef.current) {
        if (!isDragging.current && autoRotateRef.current) {
          rootGroupRef.current.rotation.y += 0.002; // Smooth slow continuous 0.2 speed rotation
        } else if (!isDragging.current) {
          rootGroupRef.current.rotation.y += rotationVelocity.current.x;
          rootGroupRef.current.rotation.x += rotationVelocity.current.y;
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
        coverMeshRef.current.parent.position.y = THREE.MathUtils.lerp(coverMeshRef.current.parent.position.y, isExploded ? 3.5 : 0.0, 0.08);
      }
      if (bmsGroupRef.current) {
        bmsGroupRef.current.position.y = THREE.MathUtils.lerp(bmsGroupRef.current.position.y, isExploded ? 2.4 : 1.1, 0.08);
      }

      cellInternalGlowLight.intensity = 5.0 + Math.sin(Date.now() * 0.004) * 1.5;
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
      if (currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [status, isExploded, interactive]);

  useEffect(() => {
    if (!coverMeshRef.current || !coverWireframeRef.current) return;
    const coverMat = coverMeshRef.current.material as THREE.MeshStandardMaterial;
    const wireMat = coverWireframeRef.current.material as THREE.LineBasicMaterial;
    if (casingMode === 'SOLID') { coverMat.opacity = 0.95; wireMat.opacity = 0.3; }
    else if (casingMode === 'TRANSPARENT') { coverMat.opacity = 0.32; wireMat.opacity = 0.45; }
    else if (casingMode === 'X-RAY') { coverMat.opacity = 0.1; wireMat.opacity = 0.95; }
  }, [casingMode]);

  return (
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[300px] flex items-center justify-center select-none bg-transparent border-0 shadow-none overflow-visible">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {!hideControls && (
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white/95 border border-slate-200 p-1.5 rounded-xl backdrop-blur-md shadow-md">
            {(['SOLID', 'TRANSPARENT', 'X-RAY'] as CasingMode[]).map((mode) => (
              <button key={mode} onClick={() => setCasingMode(mode)} className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${casingMode === mode ? 'bg-emerald-500 text-white' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`}>{mode}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsExploded(!isExploded)} className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl border backdrop-blur-md transition ${isExploded ? 'bg-red-500 text-white' : 'bg-white/95 text-emerald-700 border-emerald-400'}`}>{isExploded ? 'ASSEMBLE' : 'EXPLODED VIEW'}</button>
            <button onClick={() => setAutoRotate(!autoRotate)} className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border backdrop-blur-md transition ${autoRotate ? 'bg-emerald-50 text-emerald-700 border-emerald-400' : 'bg-white/95 text-slate-700 border-slate-200'}`}>AUTO ROTATE ↻</button>
            <button onClick={resetCamera} className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-white/95 text-slate-800 border border-slate-300">RESET ↺</button>
          </div>
        </div>
      )}

      {selectedInfo && (
        <div className="absolute bottom-12 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs z-20 bg-slate-900/95 text-white border-2 border-[#00E676] p-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-fadeIn space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <div>
              <span className="text-[10px] font-extrabold text-[#00E676] uppercase tracking-wider">{selectedInfo.type}</span>
              <h4 className="text-sm font-black text-white uppercase">{selectedInfo.name}</h4>
            </div>
            <button onClick={() => setSelectedInfo(null)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono font-bold">
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
              <div className="text-[9px] text-slate-400 uppercase">VOLTAGE</div>
              <div className="text-xs text-[#00E676] font-extrabold mt-0.5">{selectedInfo.voltage}</div>
            </div>
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
              <div className="text-[9px] text-slate-400 uppercase">TEMPERATURE</div>
              <div className="text-xs text-amber-400 font-extrabold mt-0.5">{selectedInfo.temp}</div>
            </div>
          </div>

          <p className="text-[11px] font-medium text-slate-300 leading-snug">{selectedInfo.description}</p>
        </div>
      )}

      {/* GESTURE HINT BANNER */}
      {!hideControls && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none text-xs font-mono font-bold">
          <span className="bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700 backdrop-blur-md shadow-md">
            Drag to rotate • Pinch to zoom • Tap cell for telemetry
          </span>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-500 px-2.5 py-1 rounded-xl font-extrabold shadow-sm">
            {isSimulated ? 'LIVE PINN MODEL' : 'PHYSICAL BLE BMS'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Battery3DView;
