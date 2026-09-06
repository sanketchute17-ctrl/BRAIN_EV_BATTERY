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
  const coolingPlateRef = useRef<THREE.Mesh | null>(null);
  const cellMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);

  const targetCamPos = useRef(new THREE.Vector3(0, 7.5, 11.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.4, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.4, 0));

  const resetCamera = () => {
    targetCamPos.current.set(0, 7.5, 11.5);
    targetLookAt.current.set(0, 0.4, 0);
    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.set(0.2, -0.4, 0);
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

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.copy(targetCamPos.current);
    camera.lookAt(currentLookAt.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    rootGroup.rotation.set(0.2, -0.4, 0);
    rootGroupRef.current = rootGroup;
    scene.add(rootGroup);

    // Color Palette based on Battery Safety State
    let glowHex = 0x10b981; // HEALTHY Green
    if (status === 'WATCH') glowHex = 0xf59e0b;
    if (status === 'WARNING') glowHex = 0xf97316;
    if (status === 'CRITICAL') glowHex = 0xef4444;

    // Studio & Rim Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(12, 18, 12);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    fillLight.position.set(-12, 8, -10);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(glowHex, 2.8);
    rimLight.position.set(0, 8, -14);
    scene.add(rimLight);

    const coreGlowLight = new THREE.PointLight(glowHex, 4.0, 16);
    coreGlowLight.position.set(0, 1.5, 0);
    scene.add(coreGlowLight);

    // Ground Soft Pedestal Reflection Disc
    const groundDiscGeo = new THREE.CircleGeometry(6.8, 32);
    const groundDiscMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.65,
    });
    const groundDisc = new THREE.Mesh(groundDiscGeo, groundDiscMat);
    groundDisc.rotation.x = -Math.PI / 2;
    groundDisc.position.y = -1.25;
    rootGroup.add(groundDisc);

    // Structural Aluminum Chassis Tray
    const chassisGeo = new THREE.BoxGeometry(8.4, 0.45, 5.4);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.22,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = -0.5;
    chassisMesh.receiveShadow = true;
    chassisMesh.castShadow = true;
    chassisMesh.userData = {
      name: 'Structural Aluminum Pack Chassis',
      type: 'Chassis Frame',
      status: 'NORMAL',
      risk: '0%',
      description: 'High-strength extruded aluminum safety tray with integrated side crash protection beams.',
    };
    rootGroup.add(chassisMesh);

    // Metallic Side Crash Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 });
    const sideRailLeft = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.55, 0.25), railMat);
    sideRailLeft.position.set(0, -0.45, 2.65);
    rootGroup.add(sideRailLeft);

    const sideRailRight = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.55, 0.25), railMat);
    sideRailRight.position.set(0, -0.45, -2.65);
    rootGroup.add(sideRailRight);

    // Liquid Cooling Cold Plate
    const coolingPlateGeo = new THREE.BoxGeometry(8.0, 0.14, 5.0);
    const coolingPlateMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });
    const coolingPlate = new THREE.Mesh(coolingPlateGeo, coolingPlateMat);
    coolingPlate.position.y = -0.22;
    coolingPlate.userData = {
      name: 'Liquid Cooling Cold Plate',
      type: 'Thermal Management',
      temp: '32.4 °C',
      status: 'ACTIVE FLOW',
      risk: '1%',
      description: 'Integrated dual-pass glycol cold plate maintaining uniform pack thermal distribution.',
    };
    coolingPlateRef.current = coolingPlate;
    rootGroup.add(coolingPlate);

    // 3D Curved Orange High-Voltage (HV) Cables
    const createCurvedHVCable = (startVec: THREE.Vector3, midVec: THREE.Vector3, endVec: THREE.Vector3, colorHex: number) => {
      const curve = new THREE.CatmullRomCurve3([startVec, midVec, endVec]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.14, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.2,
      });
      return new THREE.Mesh(tubeGeo, tubeMat);
    };

    // Orange HV Main Bus Cables
    const hvPosCable = createCurvedHVCable(
      new THREE.Vector3(3.8, 0.2, 1.8),
      new THREE.Vector3(4.2, 0.8, 1.2),
      new THREE.Vector3(4.2, 1.2, 0.2),
      0xff6b00 // Bright HV Orange
    );
    hvPosCable.userData = {
      name: 'Positive HV Feeder Cable (+350V)',
      type: 'High Voltage Cable',
      voltage: '350.4 V',
      status: 'ENERGIZED',
      risk: '0%',
      description: 'High-flexibility flame-retardant silicone insulated copper power cable.',
    };
    rootGroup.add(hvPosCable);

    const hvNegCable = createCurvedHVCable(
      new THREE.Vector3(3.8, 0.2, -1.8),
      new THREE.Vector3(4.2, 0.8, -1.2),
      new THREE.Vector3(4.2, 1.2, -0.2),
      0xff6b00 // Bright HV Orange
    );
    hvNegCable.userData = {
      name: 'Negative HV Return Cable (GND)',
      type: 'High Voltage Cable',
      voltage: '0 V',
      status: 'GROUNDED',
      risk: '0%',
      description: 'Shielded return conductor connected directly to main safety isolation contactors.',
    };
    rootGroup.add(hvNegCable);

    // Inter-Module Orange HV Bus Jumper
    const hvJumperCable = createCurvedHVCable(
      new THREE.Vector3(-3.8, 0.5, 0.8),
      new THREE.Vector3(-4.3, 1.0, 0.0),
      new THREE.Vector3(-3.8, 0.5, -0.8),
      0xff5500
    );
    hvJumperCable.userData = {
      name: 'Inter-Module HV Series Jumper',
      type: 'High Voltage Bus Jumper',
      voltage: '175.2 V',
      status: 'NORMAL',
      risk: '0%',
      description: 'Heavy duty copper jumper bar connecting module banks in high voltage series.',
    };
    rootGroup.add(hvJumperCable);

    // 96 Cells across 4 Battery Modules
    const cellRadius = 0.21;
    const cellHeight = 1.35;
    const cellGeo = new THREE.CylinderGeometry(cellRadius, cellRadius, cellHeight, 20);
    const capGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });

    const healthyCellMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.65,
      roughness: 0.2,
      emissive: 0x10b981,
      emissiveIntensity: 0.25,
    });

    const criticalCellMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.85,
      metalness: 0.5,
    });

    const busbarMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });

    cellMeshMap.current.clear();
    let globalCellIdx = 1;

    for (let modX = 0; modX < 2; modX++) {
      for (let modZ = 0; modZ < 2; modZ++) {
        const moduleGroup = new THREE.Group();
        const modOffsetX = (modX - 0.5) * 3.75;
        const modOffsetZ = (modZ - 0.5) * 2.35;
        moduleGroup.position.set(modOffsetX, 0, modOffsetZ);
        rootGroup.add(moduleGroup);

        const modBoxGeo = new THREE.BoxGeometry(3.35, 1.4, 1.95);
        const modBoxMat = new THREE.MeshPhysicalMaterial({
          color: 0x0f172a,
          metalness: 0.75,
          roughness: 0.25,
          transparent: true,
          opacity: 0.55,
        });
        const modBox = new THREE.Mesh(modBoxGeo, modBoxMat);
        modBox.position.set(0, 0.45, 0);
        moduleGroup.add(modBox);

        const busbarStrip = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.04, 0.14), busbarMat);
        busbarStrip.position.set(0, 1.15, 0);
        busbarStrip.userData = {
          name: `Module M${modX * 2 + modZ + 1} Nickel Busbar`,
          type: 'Busbar Component',
          voltage: '87.6 V',
          status: 'NORMAL',
          risk: '0%',
          description: 'Precision laser-welded copper-nickel busbar delivering low-impedance cell connections.',
        };
        moduleGroup.add(busbarStrip);

        for (let cx = 0; cx < 6; cx++) {
          for (let cz = 0; cz < 4; cz++) {
            const px = -1.25 + cx * 0.5;
            const pz = -0.65 + cz * 0.43;

            const isHotCell = (status === 'CRITICAL' || status === 'WARNING') && (globalCellIdx === 14 || globalCellIdx === 28);
            const cellMatToUse = isHotCell ? criticalCellMat : healthyCellMat;

            const cellMesh = new THREE.Mesh(cellGeo, cellMatToUse);
            cellMesh.position.set(px, 0.45, pz);
            cellMesh.castShadow = true;

            const cellIdStr = `C${globalCellIdx < 10 ? `0${globalCellIdx}` : globalCellIdx}`;
            cellMesh.userData = {
              cellId: globalCellIdx,
              name: `Cell ${cellIdStr}`,
              type: '21700 LFP Cylindrical Cell',
              voltage: isHotCell ? '2.92 V' : '3.65 V',
              temp: isHotCell ? '52.4 °C' : '33.5 °C',
              deviation: isHotCell ? '+140 mV' : '+8 mV',
              status: isHotCell ? 'CRITICAL THERMAL' : 'NORMAL',
              risk: isHotCell ? '88%' : '4%',
              description: 'High energy density 21700 lithium iron phosphate cylindrical cell.',
            };

            moduleGroup.add(cellMesh);
            cellMeshMap.current.set(cellIdStr, cellMesh);

            const capMesh = new THREE.Mesh(capGeo, capMat);
            capMesh.position.set(px, 1.15, pz);
            moduleGroup.add(capMesh);

            globalCellIdx++;
          }
        }
      }
    }

    // BMS Electronics Section
    const bmsGroup = new THREE.Group();
    bmsGroup.position.set(0, 1.4, 0);
    bmsGroupRef.current = bmsGroup;
    rootGroup.add(bmsGroup);

    const bmsPcbGeo = new THREE.BoxGeometry(7.6, 0.08, 0.95);
    const bmsPcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.35, metalness: 0.3 });
    const bmsPcb = new THREE.Mesh(bmsPcbGeo, bmsPcbMat);
    bmsPcb.userData = {
      name: 'BRAIN Master BMS Safety Controller',
      type: 'Battery Management System',
      voltage: '12.4 V Controller',
      temp: '37.8 °C PCB',
      status: 'ACTIVE PINN MONITORING',
      risk: '0%',
      description: 'Dual-core microcontroller executing PINN thermal safety algorithms and cell balancing.',
    };
    bmsGroup.add(bmsPcb);

    const mcuGeo = new THREE.BoxGeometry(1.1, 0.12, 0.55);
    const mcuMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2 });
    const mcuMesh = new THREE.Mesh(mcuGeo, mcuMat);
    mcuMesh.position.set(0, 0.08, 0);
    bmsGroup.add(mcuMesh);

    const ledGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const ledMat = new THREE.MeshBasicMaterial({ color: glowHex });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0.9, 0.1, 0.2);
    bmsGroup.add(ledMesh);

    // Polycarbonate Transparent Outer Casing Cover
    const coverGroup = new THREE.Group();
    coverGroup.position.y = 1.85;
    rootGroup.add(coverGroup);

    const coverGeo = new THREE.BoxGeometry(8.4, 0.4, 5.4);
    const coverMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      transparent: true,
      opacity: 0.35,
      reflectivity: 0.9,
    });
    const coverMesh = new THREE.Mesh(coverGeo, coverMat);
    coverMesh.userData = {
      name: 'Polycarbonate Transparent Top Cover',
      type: 'Pack Enclosure',
      status: 'SEALED IP67',
      risk: '0%',
      description: 'Impact resistant transparent polycarbonate outer casing providing IP67 ingress protection.',
    };
    coverMeshRef.current = coverMesh;
    coverGroup.add(coverMesh);

    const coverEdges = new THREE.EdgesGeometry(coverGeo);
    const edgeLineMat = new THREE.LineBasicMaterial({ color: glowHex, linewidth: 2, transparent: true, opacity: 0.75 });
    const coverEdgeLines = new THREE.LineSegments(coverEdges, edgeLineMat);
    coverWireframeRef.current = coverEdgeLines;
    coverGroup.add(coverEdgeLines);

    // Interaction Raycasting & Pointer Handlers
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

      rotationVelocity.current = {
        x: deltaX * 0.005,
        y: deltaY * 0.003,
      };

      rootGroupRef.current.rotation.y += rotationVelocity.current.x;
      rootGroupRef.current.rotation.x += rotationVelocity.current.y;
      rootGroupRef.current.rotation.x = Math.max(-1.2, Math.min(1.2, rootGroupRef.current.rotation.x));

      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        setAutoRotate(true);
      }, 4000);
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
            (selectedMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25;
          }

          selectedMeshRef.current = hitObj;
          if (hitObj.material && (hitObj.material as THREE.MeshStandardMaterial).emissive) {
            (hitObj.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
          }

          const worldPos = new THREE.Vector3();
          hitObj.getWorldPosition(worldPos);

          targetLookAt.current.copy(worldPos);
          targetCamPos.current.set(worldPos.x, worldPos.y + 4.5, worldPos.z + 7.5);

          setSelectedInfo({
            name: hitObj.userData.name,
            type: hitObj.userData.type || 'Component',
            voltage: hitObj.userData.voltage,
            temp: hitObj.userData.temp,
            deviation: hitObj.userData.deviation,
            status: hitObj.userData.status || 'NORMAL',
            risk: hitObj.userData.risk || '0%',
            description: hitObj.userData.description || 'Component under active telemetry monitoring.',
            isSimulated,
          });

          if (hitObj.userData.cellId && onCellSelect) {
            onCellSelect(hitObj.userData.cellId);
          }
        }
      }
    };

    const domElem = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      handlePointerDown(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };
    const onMouseUp = (e: MouseEvent) => {
      handlePointerUp();
      if (Math.abs(e.clientX - previousMousePosition.current.x) < 3 && Math.abs(e.clientY - previousMousePosition.current.y) < 3) {
        handleCanvasClick(e.clientX, e.clientY);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = e.deltaY * 0.01;
      targetCamPos.current.z = Math.max(5, Math.min(22, targetCamPos.current.z + zoomFactor));
    };

    const onTouchStart = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        // Double Tap Detected -> Reset Camera Focus
        resetCamera();
        lastTapTime.current = 0;
        return;
      }
      lastTapTime.current = now;

      if (e.touches.length === 1) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist.current = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2 && touchStartDist.current && cameraRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const deltaDist = touchStartDist.current - dist;
        targetCamPos.current.z = Math.max(5, Math.min(22, targetCamPos.current.z + deltaDist * 0.05));
        touchStartDist.current = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      handlePointerUp();
      if (e.changedTouches.length === 1 && touchStartDist.current === null) {
        handleCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      touchStartDist.current = null;
    };

    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    domElem.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Smooth Render Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDragging.current && rootGroupRef.current) {
        if (autoRotateRef.current) {
          rootGroupRef.current.rotation.y += 0.0015;
        } else {
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

      const expTargetCoverY = isExploded ? 3.8 : 1.85;
      const expTargetBmsY = isExploded ? 2.6 : 1.4;
      const expTargetCoolingY = isExploded ? -0.8 : -0.22;

      if (coverMeshRef.current && coverMeshRef.current.parent) {
        coverMeshRef.current.parent.position.y = THREE.MathUtils.lerp(
          coverMeshRef.current.parent.position.y,
          expTargetCoverY,
          0.08
        );
      }
      if (bmsGroupRef.current) {
        bmsGroupRef.current.position.y = THREE.MathUtils.lerp(
          bmsGroupRef.current.position.y,
          expTargetBmsY,
          0.08
        );
      }
      if (coolingPlateRef.current) {
        coolingPlateRef.current.position.y = THREE.MathUtils.lerp(
          coolingPlateRef.current.position.y,
          expTargetCoolingY,
          0.08
        );
      }

      coreGlowLight.intensity = 4.0 + Math.sin(Date.now() * 0.004) * 1.2;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const newW = currentMount.clientWidth;
      const newH = currentMount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [status, isExploded, interactive]);

  useEffect(() => {
    if (!coverMeshRef.current || !coverWireframeRef.current) return;
    const coverMat = coverMeshRef.current.material as THREE.MeshPhysicalMaterial;
    const wireMat = coverWireframeRef.current.material as THREE.LineBasicMaterial;

    if (casingMode === 'SOLID') {
      coverMat.opacity = 0.95;
      coverMat.transmission = 0.0;
      wireMat.opacity = 0.3;
    } else if (casingMode === 'TRANSPARENT') {
      coverMat.opacity = 0.35;
      coverMat.transmission = 0.85;
      wireMat.opacity = 0.75;
    } else if (casingMode === 'X-RAY') {
      coverMat.opacity = 0.1;
      coverMat.transmission = 0.95;
      wireMat.opacity = 0.95;
    }
  }, [casingMode]);

  return (
    <div className={`relative w-full h-full min-h-[220px] sm:min-h-[300px] flex items-center justify-center select-none ${
      hideControls
        ? 'bg-transparent'
        : 'bg-gradient-to-b from-slate-100 via-white to-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-md'
    }`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP AUTOMOTIVE LIGHT HUD CONTROLS */}
      {!hideControls && (
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-white/95 border border-slate-200 p-1.5 rounded-xl backdrop-blur-md shadow-md">
            {(['SOLID', 'TRANSPARENT', 'X-RAY'] as CasingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setCasingMode(mode)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition ${
                  casingMode === mode
                    ? 'bg-emerald-500 text-white shadow-emerald'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExploded(!isExploded)}
              className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl border backdrop-blur-md transition shadow-md ${
                isExploded
                  ? 'bg-red-500 text-white border-red-400 shadow-red'
                  : 'bg-white/95 text-emerald-700 border-emerald-400 hover:bg-emerald-50'
              }`}
            >
              {isExploded ? 'ASSEMBLE' : 'EXPLODED VIEW'}
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border backdrop-blur-md transition ${
                autoRotate
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-sm'
                  : 'bg-white/95 text-slate-700 border-slate-200'
              }`}
            >
              AUTO ROTATE ↻
            </button>

            <button
              onClick={resetCamera}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-white/95 text-slate-800 border border-slate-300 hover:border-emerald-500 backdrop-blur-md shadow-sm"
            >
              RESET ↺
            </button>
          </div>
        </div>
      )}

      {/* COMPONENT INSPECTION POPUP BADGE */}
      {selectedInfo && (
        <div className="absolute bottom-12 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs z-20 bg-white/98 border-2 border-emerald-500 p-3.5 rounded-2xl shadow-xl backdrop-blur-md animate-fadeIn space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">{selectedInfo.type}</span>
              <h4 className="text-sm font-black text-slate-900 heading-tech uppercase">{selectedInfo.name}</h4>
            </div>
            <button onClick={() => setSelectedInfo(null)} className="text-slate-400 hover:text-slate-800 p-1 font-bold text-sm">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono font-bold">
            {selectedInfo.voltage && (
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase">VOLTAGE</span>
                <span className="font-extrabold text-emerald-600 text-xs">{selectedInfo.voltage}</span>
              </div>
            )}
            {selectedInfo.temp && (
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase">TEMP</span>
                <span className="font-extrabold text-red-500 text-xs">{selectedInfo.temp}</span>
              </div>
            )}
            {selectedInfo.deviation && (
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase">DEVIATION</span>
                <span className="font-extrabold text-emerald-600 text-xs">{selectedInfo.deviation}</span>
              </div>
            )}
            {selectedInfo.risk && (
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase">RISK SCORE</span>
                <span className="font-extrabold text-red-500 text-xs">{selectedInfo.risk}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] font-medium text-slate-600 leading-snug">{selectedInfo.description}</p>
        </div>
      )}

      {/* GESTURE HINT BANNER */}
      {!hideControls && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none text-xs font-mono font-bold">
          <span className="bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700 backdrop-blur-md shadow-md">
            Drag to rotate • Pinch to zoom • Tap to inspect
          </span>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-500 px-2.5 py-1 rounded-xl font-extrabold shadow-sm">
            {isSimulated ? 'SIMULATED DATA' : 'REAL BMS'}
          </span>
        </div>
      )}
    </div>
  );
};
