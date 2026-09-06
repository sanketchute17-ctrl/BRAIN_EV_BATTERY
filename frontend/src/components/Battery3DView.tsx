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

  const targetCamPos = useRef(new THREE.Vector3(0, 6.5, 10.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.2, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.2, 0));

  const createBrainLogoTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, 488, 232);

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(28, 28, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(484, 28, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(28, 228, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(484, 228, 10, 0, Math.PI * 2); ctx.fill();

      ctx.font = '900 115px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('BRAI', 65, 130);

      ctx.fillStyle = '#10B981';
      ctx.fillText('N', 360, 130);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const resetCamera = () => {
    targetCamPos.current.set(0, 6.5, 10.5);
    targetLookAt.current.set(0, 0.2, 0);
    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.set(0.35, -0.55, 0);
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

    try {
      scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = null;

      camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 1000);
      camera.position.copy(targetCamPos.current);
      camera.lookAt(currentLookAt.current);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      rendererRef.current = renderer;
      currentMount.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('WebGL Renderer Init Fallback:', err);
      return;
    }

    const rootGroup = new THREE.Group();
    rootGroup.rotation.set(0.35, -0.55, 0);
    rootGroupRef.current = rootGroup;
    scene.add(rootGroup);

    let cellGlowHex = 0x10b981;
    if (status === 'WATCH') cellGlowHex = 0xf59e0b;
    if (status === 'WARNING') cellGlowHex = 0xf97316;
    if (status === 'CRITICAL') cellGlowHex = 0xef4444;

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 3.8);
    mainKeyLight.position.set(12, 20, 14);
    mainKeyLight.castShadow = true;
    scene.add(mainKeyLight);

    const fillBlueLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    fillBlueLight.position.set(-14, 10, -10);
    scene.add(fillBlueLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.8);
    rimLight.position.set(0, 10, -14);
    scene.add(rimLight);

    const cellInternalGlowLight = new THREE.PointLight(cellGlowHex, 6.0, 10);
    cellInternalGlowLight.position.set(1.5, 0.0, 1.8);
    rootGroup.add(cellInternalGlowLight);

    const groundDiscGeo = new THREE.CircleGeometry(6.5, 32);
    const groundDiscMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
    });
    const groundDisc = new THREE.Mesh(groundDiscGeo, groundDiscMat);
    groundDisc.rotation.x = -Math.PI / 2;
    groundDisc.position.y = -1.45;
    rootGroup.add(groundDisc);

    const packWidth = 8.6;
    const packHeight = 2.8;
    const packDepth = 4.4;

    const chassisGeo = new THREE.BoxGeometry(packWidth - 0.2, 0.35, packDepth - 0.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = -1.2;
    rootGroup.add(chassisMesh);

    const bracketGeo = new THREE.BoxGeometry(0.5, 0.25, 0.4);
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });

    [-3.2, -1.2, 1.2, 3.2].forEach((bx) => {
      [-2.1, 2.1].forEach((bz) => {
        const bracket = new THREE.Mesh(bracketGeo, bracketMat);
        bracket.position.set(bx, -1.35, bz);
        rootGroup.add(bracket);
      });
    });

    const moduleCapGeo = new THREE.BoxGeometry(1.25, 0.16, 1.85);
    const moduleCapMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });

    const screwGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12);
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.1 });

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        const capX = -3.2 + col * 1.3;
        const capZ = -1.05 + row * 2.1;

        const capMesh = new THREE.Mesh(moduleCapGeo, moduleCapMat);
        capMesh.position.set(capX, 1.15, capZ);
        rootGroup.add(capMesh);

        [-0.52, 0.52].forEach((sx) => {
          [-0.82, 0.82].forEach((sz) => {
            const screw = new THREE.Mesh(screwGeo, screwMat);
            screw.position.set(capX + sx, 1.24, capZ + sz);
            rootGroup.add(screw);
          });
        });
      }
    }

    const cellWidth = 0.38;
    const cellHeight = 2.0;
    const cellDepth = 1.6;

    const glowingCellGeo = new THREE.BoxGeometry(cellWidth, cellHeight, cellDepth);
    const glowingCellMat = new THREE.MeshStandardMaterial({
      color: cellGlowHex,
      emissive: cellGlowHex,
      emissiveIntensity: 1.8,
      metalness: 0.4,
      roughness: 0.1,
    });

    const neonBarGeo = new THREE.BoxGeometry(0.06, cellHeight - 0.1, 0.06);
    const neonBarMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 6; i++) {
      const cellX = 0.5 + i * 0.45;
      const cellZ = 1.05;

      const cellMesh = new THREE.Mesh(glowingCellGeo, glowingCellMat);
      cellMesh.position.set(cellX, 0.0, cellZ);
      cellMesh.userData = {
        name: `Active Prismatic Cell C0${i + 1}`,
        type: 'EV Battery Cell',
        voltage: '3.65 V',
        temp: '32.1 °C',
        status: 'HEALTHY',
        risk: '2%',
        description: 'High energy density vertical lithium blade cell with active status illumination.',
      };
      rootGroup.add(cellMesh);

      const neonBar = new THREE.Mesh(neonBarGeo, neonBarMat);
      neonBar.position.set(cellX, 0.0, cellZ + 0.81);
      rootGroup.add(neonBar);
    }

    const darkCellGeo = new THREE.BoxGeometry(cellWidth, cellHeight, cellDepth);
    const darkCellMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });

    for (let col = 0; col < 6; col++) {
      const cellX = -3.2 + col * 0.55;
      const cellZ = -1.05;

      const darkCell = new THREE.Mesh(darkCellGeo, darkCellMat);
      darkCell.position.set(cellX, 0.0, cellZ);
      rootGroup.add(darkCell);
    }

    const logoTexture = createBrainLogoTexture();
    const logoPlateGeo = new THREE.BoxGeometry(2.4, 1.4, 0.08);
    const logoPlateMat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      metalness: 0.6,
      roughness: 0.2,
    });
    const logoPlate = new THREE.Mesh(logoPlateGeo, logoPlateMat);
    logoPlate.position.set(2.8, 0.0, 2.12);
    logoPlate.userData = {
      name: 'BRAIN EV Intelligence Module Plate',
      type: 'Branding & Master Controller Panel',
      status: 'ONLINE',
      risk: '0%',
      description: 'BRAIN EV Master Intelligence Unit housing predictive risk algorithms.',
    };
    rootGroup.add(logoPlate);

    const createCurvedHVCable = (points: THREE.Vector3[], radius = 0.11) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 40, radius, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        roughness: 0.25,
        metalness: 0.3,
      });
      return new THREE.Mesh(tubeGeo, tubeMat);
    };

    [-0.2, 0.0, 0.2].forEach((offsetZ) => {
      const cablePoints = [
        new THREE.Vector3(-3.8, 0.95, -0.6 + offsetZ),
        new THREE.Vector3(-2.2, 0.95, -0.6 + offsetZ),
        new THREE.Vector3(-0.8, 0.95, -0.6 + offsetZ),
      ];
      const cable = createCurvedHVCable(cablePoints, 0.09);
      rootGroup.add(cable);
    });

    const clampGeo = new THREE.BoxGeometry(0.18, 0.2, 0.7);
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x020617 });
    [-3.0, -1.5].forEach((cx) => {
      const clamp = new THREE.Mesh(clampGeo, clampMat);
      clamp.position.set(cx, 1.0, -0.6);
      rootGroup.add(clamp);
    });

    const bmsCable1 = createCurvedHVCable([
      new THREE.Vector3(1.8, 1.0, -0.6),
      new THREE.Vector3(2.8, 1.1, -0.8),
      new THREE.Vector3(3.5, 1.2, -0.6),
    ]);
    rootGroup.add(bmsCable1);

    const bmsCable2 = createCurvedHVCable([
      new THREE.Vector3(2.0, 1.0, -0.4),
      new THREE.Vector3(3.0, 1.1, -0.5),
      new THREE.Vector3(3.6, 1.2, -0.3),
    ]);
    rootGroup.add(bmsCable2);

    const connectorHousingGeo = new THREE.BoxGeometry(0.4, 1.1, 1.2);
    const connectorHousingMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.3, metalness: 0.4 });
    const connectorHousing = new THREE.Mesh(connectorHousingGeo, connectorHousingMat);
    connectorHousing.position.set(-4.4, 0.0, 0.0);
    rootGroup.add(connectorHousing);

    const plugGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16);
    const plugMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    [-0.3, 0.3].forEach((pz) => {
      const plug = new THREE.Mesh(plugGeo, plugMat);
      plug.rotation.z = Math.PI / 2;
      plug.position.set(-4.6, 0.0, pz);
      rootGroup.add(plug);
    });

    const bmsGroup = new THREE.Group();
    bmsGroup.position.set(3.4, 1.1, -0.5);
    bmsGroupRef.current = bmsGroup;
    rootGroup.add(bmsGroup);

    const bmsBoxGeo = new THREE.BoxGeometry(1.2, 0.45, 0.9);
    const bmsBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const bmsBox = new THREE.Mesh(bmsBoxGeo, bmsBoxMat);
    bmsGroup.add(bmsBox);

    const goldPinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
    const goldPin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.3), goldPinMat);
    goldPin.position.set(0, 0.25, 0);
    bmsGroup.add(goldPin);

    const coverGroup = new THREE.Group();
    coverGroup.position.y = 0.0;
    rootGroup.add(coverGroup);

    const coverGeo = new THREE.BoxGeometry(packWidth, packHeight, packDepth);
    const coverMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.05,
      transmission: 0.88,
      ior: 1.5,
      transparent: true,
      opacity: 0.38,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const coverMesh = new THREE.Mesh(coverGeo, coverMat);
    coverMeshRef.current = coverMesh;
    coverGroup.add(coverMesh);

    const coverEdges = new THREE.EdgesGeometry(coverGeo);
    const edgeLineMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, linewidth: 2, transparent: true, opacity: 0.5 });
    const coverEdgeLines = new THREE.LineSegments(coverEdges, edgeLineMat);
    coverWireframeRef.current = coverEdgeLines;
    coverGroup.add(coverEdgeLines);

    const pillarGeo = new THREE.CylinderGeometry(0.42, 0.42, packHeight, 24);
    const pillarMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
    });

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
      inactivityTimer.current = setTimeout(() => { setAutoRotate(true); }, 4000);
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
            (selectedMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
          }
          selectedMeshRef.current = hitObj;
          if (hitObj.material && (hitObj.material as THREE.MeshStandardMaterial).emissive) {
            (hitObj.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
          }
          const worldPos = new THREE.Vector3();
          hitObj.getWorldPosition(worldPos);
          targetLookAt.current.copy(worldPos);
          targetCamPos.current.set(worldPos.x, worldPos.y + 4.0, worldPos.z + 6.5);
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
      targetCamPos.current.z = Math.max(4.5, Math.min(20, targetCamPos.current.z + e.deltaY * 0.01));
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
        targetCamPos.current.z = Math.max(4.5, Math.min(20, targetCamPos.current.z + (touchStartDist.current - dist) * 0.05));
        touchStartDist.current = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      handlePointerUp();
      if (e.changedTouches.length === 1 && touchStartDist.current === null) handleCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      touchStartDist.current = null;
    };

    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging.current && rootGroupRef.current) {
        if (autoRotateRef.current) rootGroupRef.current.rotation.y += 0.0012;
        else {
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
      if (currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [status, isExploded, interactive]);

  useEffect(() => {
    if (!coverMeshRef.current || !coverWireframeRef.current) return;
    const coverMat = coverMeshRef.current.material as THREE.MeshPhysicalMaterial;
    const wireMat = coverWireframeRef.current.material as THREE.LineBasicMaterial;
    if (casingMode === 'SOLID') { coverMat.opacity = 0.95; coverMat.transmission = 0.0; wireMat.opacity = 0.3; }
    else if (casingMode === 'TRANSPARENT') { coverMat.opacity = 0.38; coverMat.transmission = 0.88; wireMat.opacity = 0.5; }
    else if (casingMode === 'X-RAY') { coverMat.opacity = 0.1; coverMat.transmission = 0.95; wireMat.opacity = 0.95; }
  }, [casingMode]);

  return (
    <div className={`relative w-full h-full min-h-[220px] sm:min-h-[300px] flex items-center justify-center select-none ${!hideControls ? 'bg-gradient-to-b from-slate-100 via-white to-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-md' : ''}`}>
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
        <div className="absolute bottom-12 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs z-20 bg-white/98 border-2 border-emerald-500 p-3.5 rounded-2xl shadow-xl backdrop-blur-md animate-fadeIn space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">{selectedInfo.type}</span>
              <h4 className="text-sm font-black text-slate-900 uppercase">{selectedInfo.name}</h4>
            </div>
            <button onClick={() => setSelectedInfo(null)} className="text-slate-400 hover:text-slate-800 text-sm font-bold">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono font-bold">
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
