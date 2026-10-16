import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, Line, RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { timeline } from "./store";
import { clamp, ease, keyframes, lerp, seg } from "./anim";

/** smoothed playhead shared by every scene object */
const play = { p: 0 };

const C = {
  orange: "#FFB454",
  gold: "#F7A21B",
  blue: "#3867FF",
  cyan: "#45D8F4",
  violet: "#8865FF",
  green: "#23B87A",
  red: "#FF5A6A",
  ink: "#171923",
};

const ALICE = [-4, -0.3, 0];
const BOB = [4, -0.3, 0];
const BLOCK = [0, 1, -5];
const CHAIN_X = [-3.2, -6.4, -9.6];

/* ---------------- Camera ---------------- */
function CameraRig() {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    play.p += (timeline.progress - play.p) * (1 - Math.exp(-7 * dt));
    const p = play.p;
    const narrow = size.width < 768 ? 1.45 : 1;
    const pos = keyframes(p, [
      [0, [0, 0.4, 7.5]],
      [0.1, [0, 0.2, 5.5]],
      [0.16, [0, 1.6, 11]],
      [0.3, [-1.5, 1.4, 8.5]],
      [0.44, [0, 2.5, 13]],
      [0.58, [1.5, 2.2, 3.5]],
      [0.72, [-3, 3, 5]],
      [0.84, [-6, 2.6, 3.5]],
      [0.92, [-2, 6, 15]],
      [1, [0, 7, 17]],
    ]);
    const tgt = keyframes(p, [
      [0, [0, 0, 0]],
      [0.16, [0, 0, 0]],
      [0.3, [-2.5, 1, 0]],
      [0.44, [0, 1, -4]],
      [0.58, BLOCK],
      [0.72, [-3, 1, -5]],
      [0.84, [-7, 1, -5]],
      [0.92, [-2, 0, -3]],
      [1, [-2, 0, -3]],
    ]);
    camera.position.set(pos[0] * (narrow > 1 ? 0.8 : 1), pos[1], pos[2] * narrow);
    look.current.set(tgt[0], tgt[1], tgt[2]);
    camera.lookAt(look.current);
  });
  return null;
}

/* ---------------- Coin (the protagonist) ---------------- */
function useCoinTexture() {
  return useMemo(() => {
    const s = 512;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d")!;
    const grd = g.createRadialGradient(s * 0.38, s * 0.35, 20, s / 2, s / 2, s / 2);
    grd.addColorStop(0, "#FFE2A8");
    grd.addColorStop(0.55, "#FFB454");
    grd.addColorStop(1, "#E58A0E");
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(255,255,255,0.65)";
    g.lineWidth = 14;
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.42, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      g.fillStyle = "rgba(160,90,0,0.35)";
      g.fillRect(s / 2 + Math.cos(a) * s * 0.46 - 3, s / 2 + Math.sin(a) * s * 0.46 - 3, 6, 6);
    }
    g.fillStyle = "#FFFFFF";
    g.font = "bold 300px system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = "rgba(150,80,0,0.5)";
    g.shadowBlur = 18;
    g.fillText("₿", s / 2, s / 2 + 14);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
}

function Coin() {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const seal = useRef<THREE.Mesh>(null);
  const tex = useCoinTexture();
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.25, emissive: C.orange, emissiveIntensity: 0 });
    const face = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.55, roughness: 0.3, emissive: C.orange, emissiveIntensity: 0 });
    return [side, face, face];
  }, [tex]);

  useFrame((state) => {
    const p = play.p;
    const g = ref.current!;
    const t = state.clock.elapsedTime;
    // path of the protagonist
    const pos = keyframes(p, [
      [0, [0, 0, 0]],
      [0.14, [0, 0, 0]],
      [0.2, [-2, 1.2, 0]],
      [0.26, [ALICE[0], 0.1, 0]],
      [0.31, [ALICE[0], 0.1, 0]],
      [0.37, [-3.2, 1.6, 0]],
      [0.44, [-2.4, 1.6, 0]],
      [0.47, [-5, 2.6, -4]],
      [0.5, [-2.2, 0.2, -4]],
      [0.53, [1.8, 3, -4]],
      [0.56, [4.6, 1, -4]],
      [0.6, BLOCK],
      [0.72, BLOCK],
      [0.8, [0, 1, -5]],
      [0.86, [BOB[0], 0.1, 0]],
      [1, [BOB[0], 0.1, 0]],
    ]);
    const scale = keyframes(p, [
      [0, [1.4, 0, 0]],
      [0.14, [1.2, 0, 0]],
      [0.24, [0.55, 0, 0]],
      [0.44, [0.55, 0, 0]],
      [0.47, [0.4, 0, 0]],
      [0.58, [0.4, 0, 0]],
      [0.64, [0.45, 0, 0]],
      [0.86, [0.5, 0, 0]],
      [1, [0.5, 0, 0]],
    ])[0];
    g.position.set(pos[0], pos[1] + Math.sin(t * 1.5) * 0.06, pos[2]);
    g.scale.setScalar(scale);
    // signature flip at the start, idle spin later
    const flip = ease(seg(p, 0.02, 0.1)) * Math.PI * 2;
    g.rotation.set(Math.PI / 2, 0, 0);
    g.rotateZ(0);
    g.rotation.x = Math.PI / 2 + flip;
    g.rotation.z = Math.sin(t * 0.6) * 0.15 + seg(p, 0.14, 1) * Math.PI * 6;
    // glow while signed / in transit
    const glow = clamp(seg(p, 0.31, 0.36) - seg(p, 0.6, 0.66)) * 0.9 + Math.max(0, seg(p, 0.8, 0.86) - seg(p, 0.86, 0.9)) * 0.6;
    mats[0].emissiveIntensity = glow;
    mats[1].emissiveIntensity = glow * 0.5;
    // signature ring + seal
    const r = ring.current!;
    const sig = seg(p, 0.33, 0.39) * (1 - seg(p, 0.58, 0.6));
    r.scale.setScalar(Math.max(0.0001, sig * 1.6));
    r.rotation.z = t * 1.6;
    const sl = seal.current!;
    sl.scale.setScalar(Math.max(0.0001, ease(seg(p, 0.38, 0.42)) * (1 - seg(p, 0.58, 0.6)) * 1.1));
  });

  return (
    <group ref={ref}>
      <mesh castShadow material={mats}>
        <cylinderGeometry args={[1, 1, 0.16, 64]} />
      </mesh>
      <mesh ref={ring} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.25, 0.03, 12, 80, Math.PI * 1.6]} />
        <meshStandardMaterial color={C.cyan} emissive={C.cyan} emissiveIntensity={1.5} />
      </mesh>
      <mesh ref={seal} position={[0.95, 0.3, 0.95]}>
        <octahedronGeometry args={[0.28]} />
        <meshStandardMaterial color={C.violet} emissive={C.violet} emissiveIntensity={0.8} metalness={0.4} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ---------------- Supporting coins (intro) ---------------- */
function AltCoins() {
  const ref = useRef<THREE.Group>(null);
  const items = useMemo(
    () => [
      { c: C.blue, x: -3.2, y: 1.6, z: -2, geo: "oct" },
      { c: C.violet, x: 3.4, y: 1.2, z: -2.5, geo: "coin" },
      { c: C.cyan, x: -2.6, y: -1.7, z: -1.5, geo: "hex" },
      { c: C.green, x: 2.8, y: -1.6, z: -1.2, geo: "coin" },
    ],
    [],
  );
  useFrame((s) => {
    const p = play.p;
    const show = seg(p, 0.06, 0.1) * (1 - seg(p, 0.13, 0.17));
    const g = ref.current!;
    g.visible = show > 0.001;
    g.children.forEach((m, i) => {
      m.scale.setScalar(Math.max(0.001, show * 0.55));
      m.rotation.y = s.clock.elapsedTime * (0.6 + i * 0.15);
      m.rotation.x = 0.4;
    });
  });
  return (
    <group ref={ref}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.y, it.z]}>
          {it.geo === "oct" ? <octahedronGeometry args={[1]} /> : it.geo === "hex" ? <cylinderGeometry args={[1, 1, 0.25, 6]} /> : <cylinderGeometry args={[1, 1, 0.18, 48]} />}
          <meshStandardMaterial color={it.c} metalness={0.6} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Wallets ---------------- */
function Wallet({ at, color, label, owner }: { at: number[]; color: string; label: string; owner: "alice" | "bob" }) {
  const group = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const key = useRef<THREE.Group>(null);
  const body = useRef<THREE.MeshStandardMaterial>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  useFrame((s) => {
    const p = play.p;
    const appear = ease(seg(p, 0.12, 0.18)) * (1 - seg(p, 0.92, 0.97));
    const g = group.current!;
    g.visible = appear > 0.001;
    g.scale.setScalar(Math.max(0.001, appear));
    g.position.set(at[0], at[1] + Math.sin(s.clock.elapsedTime + at[0]) * 0.08, at[2]);
    const open =
      owner === "alice"
        ? Math.max(seg(p, 0.17, 0.22) * (1 - seg(p, 0.26, 0.29)), seg(p, 0.3, 0.33) * (1 - seg(p, 0.37, 0.4)))
        : seg(p, 0.8, 0.84) * (1 - seg(p, 0.86, 0.89));
    lid.current!.rotation.x = -open * 1.9;
    // private key unlock (Alice only)
    if (key.current) {
      const k = seg(p, 0.27, 0.31) * (1 - seg(p, 0.36, 0.4));
      key.current.visible = k > 0.001;
      key.current.position.set(lerp(-1.8, -1.05, ease(seg(p, 0.27, 0.3))), 0.1, 0.65);
      key.current.rotation.x = seg(p, 0.29, 0.31) * Math.PI * 0.5;
      key.current.scale.setScalar(Math.max(0.001, k));
    }
    const lit = owner === "bob" ? seg(p, 0.85, 0.88) : 0;
    body.current!.emissiveIntensity = lit * 0.5;
    if (htmlRef.current) htmlRef.current.style.opacity = String(appear);
  });
  return (
    <group ref={group}>
      <RoundedBox args={[2.2, 1.3, 1.1]} radius={0.22} smoothness={5} castShadow>
        <meshStandardMaterial ref={body} color={color} emissive={C.green} emissiveIntensity={0} roughness={0.35} metalness={0.1} />
      </RoundedBox>
      <mesh position={[0, 0, 0.56]}>
        <boxGeometry args={[1.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <group ref={lid} position={[0, 0.65, -0.55]}>
        <RoundedBox args={[2.24, 0.2, 1.14]} radius={0.09} smoothness={4} position={[0, 0.1, 0.57]} castShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </RoundedBox>
      </group>
      {owner === "alice" && (
        <group ref={key}>
          <mesh rotation-z={Math.PI / 2}>
            <torusGeometry args={[0.16, 0.05, 10, 24]} />
            <meshStandardMaterial color={C.orange} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.35, 0, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.04, 0.04, 0.5]} />
            <meshStandardMaterial color={C.orange} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}
      <Html position={[0, -1.15, 0]} center zIndexRange={[5, 0]}>
        <div ref={htmlRef} className="scene-label">{label}</div>
      </Html>
    </group>
  );
}

/* ---------------- P2P Network ---------------- */
const NODES: [number, number, number][] = [
  [-6, 2.4, -4], [-5, 2.6, -4], [-3.6, 0.6, -3.6], [-2.2, 0.2, -4], [-1, 2.2, -4.6],
  [0.4, 3.6, -4.2], [1.8, 3, -4], [2.6, 0.6, -4.4], [4.6, 1, -4], [5.8, 2.8, -4.6],
  [-4.8, -1, -4.4], [0.2, -0.9, -4.6], [3.8, -0.8, -3.8], [6, 0, -4.2], [-0.8, 4.4, -5],
];
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [2, 10], [10, 11], [11, 3],
  [11, 12], [12, 8], [8, 13], [13, 9], [4, 14], [14, 5], [3, 11], [7, 12], [6, 9], [1, 4],
];

function Network() {
  const group = useRef<THREE.Group>(null);
  const nodeMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const bad = useRef<THREE.Mesh>(null);
  const badMat = useRef<THREE.MeshStandardMaterial>(null);
  // order in which the valid packet reaches nodes (by x position)
  const reach = useMemo(() => NODES.map((n) => 0.465 + ((n[0] + 6) / 12) * 0.095), []);
  useFrame((s) => {
    const p = play.p;
    const show = seg(p, 0.42, 0.46) * (1 - seg(p, 0.62, 0.68));
    const g = group.current!;
    g.visible = show > 0.001;
    g.scale.setScalar(lerp(0.6, 1, show));
    nodeMats.current.forEach((m, i) => {
      if (!m) return;
      const hit = seg(p, reach[i], reach[i] + 0.012);
      const pulse = hit * (1 - seg(p, reach[i] + 0.012, reach[i] + 0.05));
      m.emissiveIntensity = 0.15 + pulse * 1.6 + hit * 0.25;
      m.color.set(hit > 0.5 ? C.cyan : "#DCE3F2");
      m.opacity = show;
    });
    // conflicting (double-spend) packet gets flagged and dissolves
    const b = bad.current!;
    const bt = seg(p, 0.48, 0.535);
    const from = NODES[10];
    const to = NODES[11];
    b.position.set(lerp(from[0], to[0], ease(bt)), lerp(from[1], to[1], ease(bt)) + 0.3, from[2]);
    const die = seg(p, 0.535, 0.56);
    b.scale.setScalar(Math.max(0.001, (bt > 0 ? 0.25 : 0) * (1 + die * 1.5) * (1 - die)));
    badMat.current!.emissiveIntensity = 0.6 + Math.sin(s.clock.elapsedTime * 12) * 0.4 * die;
  });
  return (
    <group ref={group}>
      {EDGES.map(([a, b], i) => (
        <Line key={i} points={[NODES[a], NODES[b]]} color={C.blue} lineWidth={1.2} transparent opacity={0.35} />
      ))}
      {NODES.map((n, i) => (
        <mesh key={i} position={n}>
          <icosahedronGeometry args={[0.22, 1]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) nodeMats.current[i] = m;
            }}
            color="#DCE3F2"
            emissive={C.cyan}
            emissiveIntensity={0.15}
            roughness={0.3}
            transparent
          />
        </mesh>
      ))}
      <mesh ref={bad}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial ref={badMat} color={C.red} emissive={C.red} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

/* ---------------- Blocks & chain ---------------- */
function BlockShell({ color, opacity = 0.22 }: { color: string; opacity?: number }) {
  return (
    <>
      <RoundedBox args={[2, 2, 2]} radius={0.18} smoothness={4}>
        <meshPhysicalMaterial color={color} transmission={0.6} roughness={0.15} thickness={0.6} transparent opacity={opacity + 0.5} />
      </RoundedBox>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.02, 2.02, 2.02)]} />
        <lineBasicMaterial color={color} />
      </lineSegments>
    </>
  );
}

const PANEL_DIRS: [number[], number[]][] = [
  [[0, 0, 1], [0, 0, 0]],
  [[0, 0, -1], [0, Math.PI, 0]],
  [[1, 0, 0], [0, Math.PI / 2, 0]],
  [[-1, 0, 0], [0, -Math.PI / 2, 0]],
  [[0, 1, 0], [-Math.PI / 2, 0, 0]],
  [[0, -1, 0], [Math.PI / 2, 0, 0]],
];

function NewBlock() {
  const group = useRef<THREE.Group>(null);
  const panels = useRef<THREE.Mesh[]>([]);
  const shell = useRef<THREE.Group>(null);
  const hashes = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const p = play.p;
    const g = group.current!;
    const vis = seg(p, 0.58, 0.6);
    g.visible = vis > 0.001;
    // slide into the chain
    const slide = ease(seg(p, 0.72, 0.78));
    g.position.set(BLOCK[0], BLOCK[1], BLOCK[2]);
    panels.current.forEach((m, i) => {
      if (!m) return;
      const t = ease(seg(p, 0.59 + i * 0.012, 0.64 + i * 0.012));
      const [d] = PANEL_DIRS[i];
      const dist = lerp(6, 1, t);
      m.position.set(d[0] * dist, d[1] * dist, d[2] * dist);
      (m.material as THREE.MeshStandardMaterial).opacity = t * 0.55 * (1 - seg(p, 0.69, 0.71));
    });
    // nonce search: flickering hash shards
    const mining = seg(p, 0.64, 0.66) * (1 - seg(p, 0.69, 0.7));
    hashes.current!.visible = mining > 0.01;
    hashes.current!.rotation.y = s.clock.elapsedTime * 2;
    hashes.current!.children.forEach((c, i) => {
      const on = Math.sin(s.clock.elapsedTime * 20 + i * 1.7) > 0.2;
      c.scale.setScalar(on ? mining * 0.8 : 0.001);
    });
    // found! block solidifies
    const solid = ease(seg(p, 0.69, 0.71));
    shell.current!.visible = solid > 0.001;
    shell.current!.scale.setScalar(Math.max(0.001, lerp(1.25, 1, solid)) * solid);
    const fl = seg(p, 0.69, 0.71) * (1 - seg(p, 0.71, 0.74));
    flash.current!.scale.setScalar(Math.max(0.001, fl * 4));
    (flash.current!.material as THREE.MeshBasicMaterial).opacity = fl * 0.6;
    g.position.x = lerp(BLOCK[0], BLOCK[0], slide);
  });
  return (
    <group ref={group}>
      {PANEL_DIRS.map(([, r], i) => (
        <mesh
          key={i}
          rotation={r as [number, number, number]}
          ref={(m) => {
            if (m) panels.current[i] = m;
          }}
        >
          <planeGeometry args={[1.9, 1.9]} />
          <meshStandardMaterial color={C.blue} transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <group ref={hashes}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i * 0.63) * 1.9, Math.sin(i * 1.3) * 0.9, Math.sin(i * 0.63) * 1.9]}>
            <boxGeometry args={[0.5, 0.12, 0.02]} />
            <meshStandardMaterial color={i % 3 === 0 ? C.red : C.violet} emissive={i % 3 === 0 ? C.red : C.violet} emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>
      <group ref={shell}>
        <BlockShell color={C.blue} />
      </group>
      <mesh ref={flash}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={C.cyan} transparent opacity={0} />
      </mesh>
    </group>
  );
}

function Chain() {
  const group = useRef<THREE.Group>(null);
  const link = useRef<THREE.Mesh>(null);
  const linkMat = useRef<THREE.MeshStandardMaterial>(null);
  const colors = [C.violet, C.cyan, C.orange];
  useFrame((s) => {
    const p = play.p;
    const show = ease(seg(p, 0.7, 0.75));
    const g = group.current!;
    g.visible = show > 0.001;
    g.children.forEach((c, i) => {
      if (c.userData.block !== undefined) {
        const idx = c.userData.block as number;
        c.position.y = BLOCK[1] + Math.sin(s.clock.elapsedTime + idx) * 0.06 + (1 - show) * -3;
        c.scale.setScalar(Math.max(0.001, show));
        c.rotation.y = Math.sin(s.clock.elapsedTime * 0.5 + i) * 0.05;
      }
    });
    const l = ease(seg(p, 0.76, 0.8));
    link.current!.scale.set(1, Math.max(0.001, l), 1);
    linkMat.current!.emissiveIntensity = 0.4 + l * Math.max(0, 1 - seg(p, 0.8, 0.84)) * 1.5;
  });
  return (
    <group ref={group}>
      {CHAIN_X.map((x, i) => (
        <group key={i} position={[x, BLOCK[1], BLOCK[2]]} userData={{ block: i }}>
          <BlockShell color={colors[i]} />
          <Html position={[0, -1.5, 0]} center zIndexRange={[5, 0]}>
            <div className="scene-label">Block #{840002 - i}</div>
          </Html>
        </group>
      ))}
      {CHAIN_X.slice(0, 2).map((x, i) => (
        <mesh key={i} position={[x - 1.6, BLOCK[1], BLOCK[2]]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, 1.2]} />
          <meshStandardMaterial color={C.ink} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh ref={link} position={[-1.6, BLOCK[1], BLOCK[2]]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.09, 0.09, 1.2]} />
        <meshStandardMaterial ref={linkMat} color={C.cyan} emissive={C.cyan} emissiveIntensity={0.4} metalness={0.4} />
      </mesh>
    </group>
  );
}

/* ---------------- Atmosphere ---------------- */
function Particles() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 420;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const palette = [C.blue, C.cyan, C.violet, C.orange].map((c) => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24 - 4;
      const c = palette[i % 4];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  useFrame((s) => {
    ref.current!.rotation.y = s.clock.elapsedTime * 0.01 + play.p * 0.6;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.07} vertexColors transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

export function Scene() {
  return (
    <>
      <color attach="background" args={["#FFFFFF"]} />
      <fog attach="fog" args={["#FFFFFF", 14, 34]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 5, 2]} scale={[10, 10, 1]} />
        <Lightformer intensity={1.2} color="#9fd8ff" position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
        <Lightformer intensity={1} color="#ffd9a0" position={[6, 1, 1]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
      </Environment>
      <CameraRig />
      <Particles />
      <AltCoins />
      <Coin />
      <Wallet at={ALICE} color={C.blue} label="Alice's Wallet" owner="alice" />
      <Wallet at={BOB} color={C.violet} label="Bob's Wallet" owner="bob" />
      <Network />
      <NewBlock />
      <Chain />
      <ContactShadows position={[0, -1.6, 0]} opacity={0.25} scale={30} blur={2.6} far={6} />
    </>
  );
}
