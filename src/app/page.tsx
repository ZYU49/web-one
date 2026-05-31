"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, PerspectiveCamera, Text } from "@react-three/drei";
import { ArrowDown, Code2, ExternalLink, GitBranch, Layers3, MousePointer2, Palette, Sparkles, Zap } from "lucide-react";
import Lenis from "lenis";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Pointer = {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
};

type Mode = "orbit" | "prism" | "signal";
type InteractionMode = "atom" | "proton" | "work" | "launch";
type TransmissionMaterial = THREE.MeshPhysicalMaterial & {
  chromaticAberration: number;
  distortion: number;
};

const modes: Array<{ id: Mode; label: string; icon: typeof Sparkles }> = [
  { id: "orbit", label: "Orbit", icon: Sparkles },
  { id: "prism", label: "Prism", icon: Palette },
  { id: "signal", label: "Signal", icon: Zap },
];

const projects = [
  {
    label: "Interface",
    title: "Spatial Portfolio",
    body: "A cinematic homepage system for personal work, case studies, and interactive experiments.",
    accent: "#5ee7d4",
    meta: "3D / Motion",
  },
  {
    label: "Prototype",
    title: "Product Reveal",
    body: "A scroll sequence that can rotate, inspect, and introduce a product with depth and pace.",
    accent: "#ffcf6d",
    meta: "Next / Three",
  },
  {
    label: "System",
    title: "Creative Lab",
    body: "A modular visual language ready for future scenes, cards, models, and launch pages.",
    accent: "#f07855",
    meta: "Brand / Web",
  },
];

const modePalettes: Record<InteractionMode, { primary: string; secondary: string; shell: string; electronA: string; electronB: string }> = {
  atom: {
    primary: "#5ee7d4",
    secondary: "#ffcf6d",
    shell: "#dff7ff",
    electronA: "#d8fff7",
    electronB: "#ffe5a3",
  },
  proton: {
    primary: "#44b7ff",
    secondary: "#ff4fd8",
    shell: "#b8e8ff",
    electronA: "#d8f2ff",
    electronB: "#ffd0f4",
  },
  work: {
    primary: "#b7ff2a",
    secondary: "#d6e1d2",
    shell: "#e8ffcf",
    electronA: "#efffd9",
    electronB: "#c6ff58",
  },
  launch: {
    primary: "#fff4df",
    secondary: "#ff3048",
    shell: "#fff3ea",
    electronA: "#fff7ee",
    electronB: "#ff6a5f",
  },
};

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max <= 0 ? 0 : window.scrollY / max);
    };

    const raf = (time: number) => {
      lenis.raf(time);
      updateProgress();
      requestAnimationFrame(raf);
    };

    const frame = requestAnimationFrame(raf);
    window.addEventListener("resize", updateProgress);
    updateProgress();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateProgress);
      lenis.destroy();
    };
  }, []);

  return progress;
}

function usePointer() {
  const [pointer, setPointer] = useState<Pointer>({ x: 0, y: 0, clientX: 0, clientY: 0 });

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      setPointer({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    };

    window.addEventListener("pointermove", handlePointer);
    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  return pointer;
}

function useInteractionPulse() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let frame = 0;

    const triggerPulse = () => setPulse((value) => Math.min(1, value + 0.58));
    const fadePulse = () => {
      setPulse((value) => Math.max(0, value * 0.92 - 0.004));
      frame = requestAnimationFrame(fadePulse);
    };

    frame = requestAnimationFrame(fadePulse);
    window.addEventListener("pointerdown", triggerPulse);
    window.addEventListener("keydown", triggerPulse);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", triggerPulse);
      window.removeEventListener("keydown", triggerPulse);
    };
  }, []);

  return pulse;
}

function CoreObject({
  activeProject,
  mode,
  interactionMode,
  progress,
  pointer,
  pulse,
}: {
  activeProject: number;
  mode: Mode;
  interactionMode: InteractionMode;
  progress: number;
  pointer: Pointer;
  pulse: number;
}) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const aura = useRef<THREE.Mesh>(null);
  const shellMaterial = useRef<TransmissionMaterial>(null);
  const innerMaterial = useRef<THREE.MeshStandardMaterial>(null);

  const palette = modePalettes[interactionMode];
  const accent = interactionMode === "atom" ? (projects[activeProject]?.accent ?? palette.primary) : palette.secondary;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const modeBoost = mode === "prism" ? 0.18 : mode === "signal" ? 0.32 : 0;

    if (group.current) {
      group.current.rotation.y = progress * Math.PI * (2.25 + modeBoost) + pointer.x * 0.18 + activeProject * 0.16;
      group.current.rotation.x = Math.sin(time * 0.45) * 0.12 + pointer.y * 0.12;
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0, 0.06);
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, Math.sin(time * 0.7) * 0.08 - progress * 0.5 + (activeProject - 1) * 0.04, 0.06);
      group.current.scale.lerp(new THREE.Vector3(1 + pulse * 0.06, 1 + pulse * 0.06, 1 + pulse * 0.06), 0.08);
    }

    if (inner.current) {
      inner.current.rotation.z = -time * (mode === "signal" ? 0.58 : 0.32) - progress * Math.PI;
      const scale = 0.78 + Math.sin(time * 1.2) * 0.035 + progress * 0.18 + activeProject * 0.035 + pulse * 0.12;
      inner.current.scale.setScalar(scale);
    }

    if (rings.current) {
      rings.current.rotation.x = time * (mode === "orbit" ? 0.17 : 0.28) + progress * 1.8 + pulse * 0.18;
      rings.current.rotation.z = -time * 0.12 - pulse * 0.24;
    }

    if (aura.current) {
      aura.current.rotation.y = -time * 0.16 + progress * 1.3;
      aura.current.scale.setScalar(1.72 + pulse * 0.36 + Math.sin(time * 0.9) * 0.025);
      const material = aura.current.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, 0.12 + pulse * 0.16, 0.08);
    }

    if (shellMaterial.current) {
      shellMaterial.current.color.lerp(new THREE.Color(mode === "prism" && interactionMode === "atom" ? "#f4f1e8" : palette.shell), 0.035);
      shellMaterial.current.distortion = THREE.MathUtils.lerp(shellMaterial.current.distortion, (mode === "signal" ? 0.48 : 0.28) + pulse * 0.18, 0.06);
      shellMaterial.current.chromaticAberration = THREE.MathUtils.lerp(shellMaterial.current.chromaticAberration, (mode === "prism" ? 0.16 : 0.08) + pulse * 0.06, 0.06);
    }

    if (innerMaterial.current) {
      innerMaterial.current.color.lerp(new THREE.Color(accent), 0.06);
      innerMaterial.current.emissive.lerp(new THREE.Color(accent), 0.06);
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.7} rotationIntensity={0.25} floatIntensity={0.35}>
        <mesh ref={aura}>
          <sphereGeometry args={[1.18, 48, 48]} />
          <meshBasicMaterial color={palette.primary} transparent opacity={0.12} wireframe depthWrite={false} />
        </mesh>
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[1.45, 8]} />
          <MeshTransmissionMaterial
            ref={(material) => {
              shellMaterial.current = material as TransmissionMaterial | null;
            }}
            anisotropicBlur={0.22}
            backside
            chromaticAberration={0.08}
            color="#dff7ff"
            distortion={0.28}
            distortionScale={0.42}
            ior={1.35}
            roughness={0.18}
            temporalDistortion={0.18}
            thickness={0.8}
            transmission={0.9}
          />
        </mesh>
        <mesh ref={inner}>
          <torusKnotGeometry args={[0.72, 0.12, 180, 18]} />
          <meshStandardMaterial ref={innerMaterial} color="#ffcf6d" emissive="#b74221" emissiveIntensity={0.78} metalness={0.25} roughness={0.28} />
        </mesh>
      </Float>

      <group ref={rings}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} rotation={[Math.PI / 2 + index * 0.46, index * 0.35, index * 0.22]}>
            <torusGeometry args={[2.1 + index * 0.24, 0.012, 10, 180]} />
            <meshBasicMaterial color={index === 1 ? palette.secondary : palette.primary} transparent opacity={0.38 - index * 0.07} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ElectronSwarm({ mode, interactionMode, progress, pointer, pulse }: { mode: Mode; interactionMode: InteractionMode; progress: number; pointer: Pointer; pulse: number }) {
  const group = useRef<THREE.Group>(null);
  const electrons = useRef<Array<THREE.Mesh | null>>([]);
  const pulses = useRef<Array<THREE.Mesh | null>>([]);
  const palette = modePalettes[interactionMode];

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const speed = mode === "signal" ? 1.55 : mode === "prism" ? 1.18 : 1;

    if (group.current) {
      group.current.rotation.y = time * 0.04 + progress * 1.8 + pointer.x * 0.08;
      group.current.rotation.x = pointer.y * 0.08;
    }

    electrons.current.forEach((electron, index) => {
      if (!electron) return;
      const phase = time * speed * (0.58 + index * 0.055) + index * 1.7 + progress * Math.PI * 1.4;
      const radius = 2.15 + (index % 3) * 0.22 + pulse * 0.16;
      const tilt = index * 0.72;
      electron.position.x = Math.cos(phase) * radius;
      electron.position.y = Math.sin(phase + tilt) * 0.88;
      electron.position.z = Math.sin(phase) * radius * 0.42;
      electron.scale.setScalar(0.072 + Math.sin(time * 2 + index) * 0.012);
    });

    pulses.current.forEach((pulse, index) => {
      if (!pulse) return;
      pulse.rotation.x = time * (0.12 + index * 0.03) + progress * 0.8;
      pulse.rotation.y = -time * (0.08 + index * 0.02);
      pulse.scale.setScalar(1 + Math.sin(time * 1.1 + index) * 0.035);
    });
  });

  return (
    <group ref={group}>
      {[0, 1, 2, 3].map((index) => (
        <mesh
          key={index}
          ref={(node) => {
            pulses.current[index] = node;
          }}
          rotation={[Math.PI / 2 + index * 0.42, index * 0.34, index * 0.16]}
        >
          <torusGeometry args={[2.46 + index * 0.18, 0.006, 8, 220]} />
          <meshBasicMaterial color={index % 2 === 0 ? palette.primary : palette.secondary} transparent opacity={0.28 - index * 0.035} />
        </mesh>
      ))}
      {Array.from({ length: 10 }).map((_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            electrons.current[index] = node;
          }}
        >
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? palette.electronA : palette.electronB}
            emissive={index % 2 === 0 ? palette.primary : palette.secondary}
            emissiveIntensity={1.8}
            roughness={0.16}
          />
        </mesh>
      ))}
    </group>
  );
}

function EnergyFilaments({ mode, interactionMode, progress, pointer, pulse }: { mode: Mode; interactionMode: InteractionMode; progress: number; pointer: Pointer; pulse: number }) {
  const group = useRef<THREE.Group>(null);
  const filaments = useRef<Array<THREE.Mesh | null>>([]);
  const palette = modePalettes[interactionMode];

  const paths = useMemo(() => {
    return Array.from({ length: 9 }, (_, pathIndex) => {
      const points = Array.from({ length: 42 }, (_, pointIndex) => {
        const phase = pointIndex / 41;
        const twist = phase * Math.PI * 2.4 + pathIndex * 0.72;
        const radius = 1.86 + Math.sin(phase * Math.PI * 3 + pathIndex) * 0.22;
        return new THREE.Vector3(
          Math.cos(twist) * radius,
          (phase - 0.5) * 3.2 + Math.sin(twist * 1.4) * 0.24,
          Math.sin(twist) * radius * 0.55,
        );
      });

      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.TubeGeometry(curve, 96, 0.008, 5, false);
    });
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = -time * 0.06 + progress * 2.2 + pointer.x * 0.16;
      group.current.rotation.x = Math.sin(time * 0.25) * 0.12 + pointer.y * 0.1;
      group.current.scale.setScalar(1 + pulse * 0.08);
    }

    filaments.current.forEach((filament, index) => {
      if (!filament) return;
      filament.rotation.y = time * (0.08 + index * 0.009);
      filament.rotation.z = Math.sin(time * 0.28 + index) * 0.12;
      const material = filament.material as THREE.MeshBasicMaterial;
      material.opacity = 0.16 + Math.sin(time * 1.1 + index) * 0.055 + pulse * 0.16;
      material.color.lerp(new THREE.Color(mode === "prism" && interactionMode === "atom" ? "#f4f1e8" : index % 2 ? palette.secondary : palette.primary), 0.04);
    });
  });

  return (
    <group ref={group}>
      {paths.map((geometry, index) => (
        <mesh
          key={index}
          ref={(node) => {
            filaments.current[index] = node;
          }}
          geometry={geometry}
          rotation={[index * 0.28, index * 0.19, index * 0.44]}
        >
          <meshBasicMaterial color={index % 2 ? palette.secondary : palette.primary} transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function GravityLattice({ mode, interactionMode, progress, pulse }: { mode: Mode; interactionMode: InteractionMode; progress: number; pulse: number }) {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<Array<THREE.Mesh | null>>([]);
  const palette = modePalettes[interactionMode];

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.z = time * 0.018 + progress * 0.9;
      group.current.position.z = -3.2 + progress * 1.2;
    }

    rings.current.forEach((ring, index) => {
      if (!ring) return;
      ring.rotation.x = Math.PI / 2 + Math.sin(time * 0.18 + index) * 0.08;
      ring.rotation.y = time * (0.018 + index * 0.004);
      ring.scale.setScalar(1 + pulse * (0.04 + index * 0.01));
      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = 0.05 + index * 0.012 + pulse * 0.055;
      material.color.lerp(new THREE.Color(mode === "signal" && interactionMode === "atom" ? "#f07855" : index % 2 ? palette.secondary : palette.primary), 0.025);
    });
  });

  return (
    <group ref={group} position={[0, 0, -3.2]}>
      {Array.from({ length: 7 }).map((_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            rings.current[index] = node;
          }}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[3.2 + index * 0.54, 0.0035, 6, 220]} />
          <meshBasicMaterial color={index % 2 ? palette.secondary : palette.primary} transparent opacity={0.05 + index * 0.012} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function FieldPanels({ activeProject, mode, progress }: { activeProject: number; mode: Mode; progress: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = -progress * 1.4 + activeProject * 0.12;
    group.current.position.z = progress * 1.8 - 0.8;
    group.current.position.x = Math.sin(clock.getElapsedTime() * 0.22) * 0.18 + (mode === "signal" ? 0.24 : 0);
  });

  const panels = useMemo(
    () => [
      { position: [-3.4, 0.8, -1.4], rotation: [0.15, 0.5, -0.08], color: "#56c7ff" },
      { position: [3.15, -0.15, -2.1], rotation: [-0.1, -0.65, 0.12], color: "#f27d52" },
      { position: [-2.2, -1.7, -2.8], rotation: [0.18, 0.28, 0.16], color: "#8ae6b1" },
      { position: [2.5, 1.45, -3.4], rotation: [-0.22, -0.42, -0.1], color: "#f0d66f" },
    ],
    [],
  );

  return (
    <group ref={group}>
      {panels.map((panel, index) => (
        <mesh key={index} position={panel.position as [number, number, number]} rotation={panel.rotation as [number, number, number]}>
          <boxGeometry args={[1.35, 0.82, 0.035]} />
          <meshStandardMaterial color={panel.color} emissive={panel.color} emissiveIntensity={0.22} metalness={0.12} roughness={0.42} transparent opacity={0.48} />
        </mesh>
      ))}
    </group>
  );
}

function CosmicBackdrop({ mode, progress }: { mode: Mode; progress: number }) {
  const dust = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const veil = useRef<THREE.Group>(null);

  const dustPositions = useMemo(() => {
    const count = 1600;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const radius = 4.5 + seededNoise(i + 1) * 8;
      const theta = seededNoise(i + 101) * Math.PI * 2;
      const height = (seededNoise(i + 201) - 0.5) * 6.2;
      array[i * 3] = Math.cos(theta) * radius;
      array[i * 3 + 1] = height;
      array[i * 3 + 2] = Math.sin(theta) * radius - 5 - seededNoise(i + 301) * 4;
    }

    return array;
  }, []);

  const linePositions = useMemo(() => {
    const anchors = [
      [-4.8, 1.8, -5.2],
      [-3.6, 2.4, -5.8],
      [-2.4, 1.2, -6.4],
      [-1.2, 2.0, -7.1],
      [0.4, 1.3, -6.8],
      [1.7, 2.2, -7.6],
      [3.1, 1.1, -6.9],
      [4.2, 1.8, -6.1],
      [-3.8, -1.6, -6.2],
      [-2.1, -2.2, -7.3],
      [-0.3, -1.4, -6.5],
      [1.4, -2.0, -7.4],
      [3.0, -1.2, -6.6],
    ];
    const pairs = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [2, 9],
      [5, 11],
    ];
    const array = new Float32Array(pairs.length * 2 * 3);

    pairs.forEach(([from, to], index) => {
      const start = anchors[from];
      const end = anchors[to];
      array.set(start, index * 6);
      array.set(end, index * 6 + 3);
    });

    return array;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (dust.current) {
      dust.current.rotation.y = time * 0.012 + progress * 0.9;
      dust.current.position.z = progress * 1.8;
    }
    if (lines.current) {
      lines.current.rotation.y = -time * 0.018 - progress * 0.7;
      lines.current.position.y = Math.sin(time * 0.25) * 0.12;
    }
    if (veil.current) {
      veil.current.rotation.z = Math.sin(time * 0.18) * 0.06 + progress * 0.2;
      veil.current.position.x = mode === "prism" ? -0.25 : mode === "signal" ? 0.25 : 0;
    }
  });

  return (
    <group>
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#e8fff9" size={0.018} transparent opacity={0.58} sizeAttenuation />
      </points>
      <lineSegments ref={lines}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#8df2df" transparent opacity={0.18} />
      </lineSegments>
      <group ref={veil} position={[0, 0, -7.8]}>
        <mesh rotation={[0.1, -0.35, 0.08]} position={[-2.4, 0.7, 0]}>
          <planeGeometry args={[5.5, 1.1]} />
          <meshBasicMaterial color="#5ee7d4" transparent opacity={0.055} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-0.08, 0.28, -0.18]} position={[2.2, -1.0, -0.6]}>
          <planeGeometry args={[6.2, 1.25]} />
          <meshBasicMaterial color="#ffcf6d" transparent opacity={0.05} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function ParticleRiver({ mode, progress }: { mode: Mode; progress: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 850;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const angle = i * 0.21;
      const radius = 1.5 + (i % 37) * 0.055;
      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = (Math.sin(i * 0.11) * 1.5) + ((i % 19) - 9) * 0.035;
      array[i * 3 + 2] = Math.sin(angle) * radius - 4 - (i % 13) * 0.16;
    }

    return array;
  }, []);

  useFrame(({ clock }) => {
    if (!points.current) return;
    points.current.rotation.y = clock.getElapsedTime() * (mode === "signal" ? 0.08 : 0.035) + progress * 2.4;
    points.current.rotation.x = progress * 0.45;
    points.current.position.z = progress * 3.2;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#c7f8ff" size={0.022} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Scene({
  activeProject,
  mode,
  interactionMode,
  progress,
  pointer,
  pulse,
}: {
  activeProject: number;
  mode: Mode;
  interactionMode: InteractionMode;
  progress: number;
  pointer: Pointer;
  pulse: number;
}) {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const palette = modePalettes[interactionMode];

  useFrame(() => {
    if (!camera.current) return;
    camera.current.position.x = THREE.MathUtils.lerp(camera.current.position.x, Math.sin(progress * Math.PI * 1.6) * 2.2 + pointer.x * 0.28 + (activeProject - 1) * 0.18, 0.06);
    camera.current.position.y = THREE.MathUtils.lerp(camera.current.position.y, 0.8 - progress * 1.15 - pointer.y * 0.16 + pulse * 0.08, 0.06);
    camera.current.position.z = THREE.MathUtils.lerp(camera.current.position.z, 6.4 - progress * 2.8 - pulse * 0.32, 0.06);
    camera.current.lookAt(0, -progress * 0.55, 0);
  });

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={42} position={[0, 0.8, 6.4]} />
      <color attach="background" args={["#070807"]} />
      <fog attach="fog" args={["#070807", 6, 13]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 3]} intensity={2.2} color={interactionMode === "launch" ? "#fff4df" : "#fff1bf"} />
      <pointLight position={[-3.2, -1.4, 3]} intensity={interactionMode === "atom" ? 8 : 10} color={palette.primary} distance={8} />
      <pointLight position={[2.8, 2.4, 1.6]} intensity={interactionMode === "atom" ? 5 : 7} color={palette.secondary} distance={7} />
      <GravityLattice mode={mode} interactionMode={interactionMode} progress={progress} pulse={pulse} />
      <CosmicBackdrop mode={mode} progress={progress} />
      <EnergyFilaments mode={mode} interactionMode={interactionMode} progress={progress} pointer={pointer} pulse={pulse} />
      <ElectronSwarm mode={mode} interactionMode={interactionMode} progress={progress} pointer={pointer} pulse={pulse} />
      <CoreObject activeProject={activeProject} mode={mode} interactionMode={interactionMode} progress={progress} pointer={pointer} pulse={pulse} />
      <FieldPanels activeProject={activeProject} mode={mode} progress={progress} />
      <ParticleRiver mode={mode} progress={progress} />
      <Text
        position={[0, -2.45, -1.2]}
        rotation={[-0.18, 0, 0]}
        fontSize={0.18}
        letterSpacing={0.12}
        color="#e8efe8"
        anchorX="center"
        anchorY="middle"
      >
        WEB ONE
      </Text>
    </>
  );
}

function ProgressRail({ progress }: { progress: number }) {
  return (
    <div className="progress-rail" aria-hidden="true">
      <div style={{ transform: `scaleY(${Math.max(0.04, progress)})` }} />
    </div>
  );
}

function ModeDock({ mode, setMode }: { mode: Mode; setMode: (mode: Mode) => void }) {
  return (
    <div className="mode-dock" aria-label="Atom variant selector">
      <span className="mode-dock-label">Atom state</span>
      {modes.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={mode === item.id ? "active" : ""} type="button" onClick={() => setMode(item.id)} aria-pressed={mode === item.id}>
            <Icon size={15} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProjectDeck({ activeProject, interactionMode, setActiveProject }: { activeProject: number; interactionMode: InteractionMode; setActiveProject: (index: number) => void }) {
  const workAccents = ["#b7ff2a", "#d6e1d2", "#84ff6c"];

  return (
    <div className="project-deck">
      {projects.map((project, index) => (
        <article
          className={activeProject === index ? "project-card active" : "project-card"}
          key={project.title}
          onClick={() => setActiveProject(index)}
          onFocus={() => setActiveProject(index)}
          onMouseEnter={() => setActiveProject(index)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setActiveProject(index);
            }
          }}
          style={{ "--accent": interactionMode === "work" ? workAccents[index] : project.accent } as CSSProperties}
          tabIndex={0}
        >
          <div className="project-card-top">
            <span>{project.label}</span>
            <ExternalLink size={16} />
          </div>
          <h3>{project.title}</h3>
          <p>{project.body}</p>
          <small>{project.meta}</small>
        </article>
      ))}
    </div>
  );
}

export default function Home() {
  const progress = useScrollProgress();
  const pointer = usePointer();
  const pulse = useInteractionPulse();
  const [mode, setMode] = useState<Mode>("orbit");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("atom");
  const [activeProject, setActiveProject] = useState(0);

  useEffect(() => {
    const syncModeFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "proton" || hash === "work" || hash === "launch") {
        setInteractionMode(hash);
      } else if (hash === "atom" || hash === "") {
        setInteractionMode("atom");
      }
    };

    syncModeFromHash();
    window.addEventListener("hashchange", syncModeFromHash);
    return () => window.removeEventListener("hashchange", syncModeFromHash);
  }, []);

  return (
    <main className={`web-one ${interactionMode}-active`} style={{ "--pulse": pulse } as CSSProperties}>
      <div
        className="cursor-aura"
        style={{
          transform: `translate3d(${pointer.clientX}px, ${pointer.clientY}px, 0)`,
        }}
        aria-hidden="true"
      />
      <div className="scene-layer" aria-hidden="true">
        <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
          <Scene activeProject={activeProject} mode={mode} interactionMode={interactionMode} progress={progress} pointer={pointer} pulse={pulse} />
        </Canvas>
      </div>

      <ProgressRail progress={progress} />
      <ModeDock mode={mode} setMode={setMode} />

      <header className="topbar">
        <a href="#top" className="brand" aria-label="Web One home">
          <Sparkles size={18} />
          <span>Web One</span>
        </a>
        <nav aria-label="Primary">
          <a className={interactionMode === "atom" ? "active" : ""} href="#atom" onClick={() => setInteractionMode("atom")}>
            Atom
          </a>
          <a className={interactionMode === "proton" ? "active" : ""} href="#proton" onClick={() => setInteractionMode("proton")}>
            Proton
          </a>
          <a className={interactionMode === "work" ? "active" : ""} href="#work" onClick={() => setInteractionMode("work")}>
            Work
          </a>
          <a className={interactionMode === "launch" ? "active" : ""} href="#launch" onClick={() => setInteractionMode("launch")}>
            Launch
          </a>
        </nav>
      </header>

      <section id="top" className="hero-panel">
        <div className="hero-copy">
          <p>Interactive mode 01 / Atom</p>
          <h1>Web One</h1>
          <div className="signal-strip" aria-label="Web One capabilities">
            <span>
              <MousePointer2 size={16} />
              Pointer reactive
            </span>
            <span>
              <Layers3 size={16} />
              3D layers
            </span>
            <span>
              <Code2 size={16} />
              Portfolio ready
            </span>
          </div>
          <a className="scroll-cue" href="#atom" aria-label="Scroll to Atom mode">
            <ArrowDown size={18} />
          </a>
        </div>
      </section>

      <section id="atom" className="scroll-section align-right mode-section atom-mode">
        <div>
          <span>Mode 01 / Atom</span>
          <h2>Orbital interaction field</h2>
          <p>Atom is the current core mode: scroll drives the camera path, pointer motion bends the object, and the scene behaves like a small universe under your hand.</p>
        </div>
      </section>

      <section id="proton" className="scroll-section align-left mode-section proton-mode">
        <div>
          <span>Mode 02 / Proton</span>
          <h2>Paused for a stronger idea.</h2>
          <p>The diamond direction is removed. Proton will come back when it has the same level of realism and motion logic as Atom.</p>
        </div>
      </section>

      <section className="scroll-section align-right mode-section launch-preview-mode">
        <div>
          <span>Mode 03 / Transition</span>
          <h2>Each mode gets its own behavior.</h2>
          <p>Atom sets the language. Studio, Work, and Launch can each have a different interaction rule instead of sharing the same scroll feeling.</p>
        </div>
      </section>

      <section id="work" className="work-section">
        <div className="work-heading">
          <span>Mode 03 / Work</span>
          <h2>Work mode becomes the portfolio engine.</h2>
        </div>
        <ProjectDeck activeProject={activeProject} interactionMode={interactionMode} setActiveProject={setActiveProject} />
      </section>

      <section id="launch" className="final-section">
        <div className="launch-line">
          <span>Mode 04 / Launch</span>
          <h2>Launch mode can become the final sequence.</h2>
          <p>A compressed, high-energy ending: contact, social links, availability, and one clean action after the viewer has moved through the site.</p>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <GitBranch size={18} />
            <span>Prepare repo</span>
          </a>
        </div>
      </section>
    </main>
  );
}
