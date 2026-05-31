"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text, Sparkles } from "@react-three/drei";
import type * as THREE from "three";
import type { AgentAvatar } from "./agents";
import type { AgentStatus } from "@/lib/types";

interface Props {
  avatar: AgentAvatar;
  position: [number, number, number];
  status?: AgentStatus;
  isHovered?: boolean;
}

export function Mascot({ avatar, position, status }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const isRunning = status === "started";
  const isDone = status === "done";
  const isError = status === "error";

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const now = performance.now();
    if (isError) {
      groupRef.current.position.x = position[0] + Math.sin(now * 0.04) * 0.1;
    } else {
      groupRef.current.position.x = position[0];
    }
    if (ringRef.current && isDone) {
      const t = (now % 1200) / 1200;
      ringRef.current.scale.setScalar(1 + t * 0.6);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.8 * (1 - t);
    }
    // Per-shape signature motion when running
    if (isRunning) {
      const t = now / 1000;
      switch (avatar.shape) {
        case "airplane":
          groupRef.current.rotation.z = Math.sin(t * 2.4) * 0.2;
          groupRef.current.rotation.y += dt * 0.5;
          break;
        case "coin":
          groupRef.current.rotation.y += dt * 4.0;
          break;
        case "lantern":
          groupRef.current.rotation.z = Math.sin(t * 1.4) * 0.18;
          break;
        case "magnifier":
          groupRef.current.rotation.z = Math.sin(t * 1.8) * 0.4;
          groupRef.current.rotation.y += dt * 0.8;
          break;
        case "scroll":
        case "book":
          groupRef.current.rotation.y += dt * 1.4;
          break;
        case "pagoda":
          // gentle stagger bob is implicit in Float; tiny rotation
          groupRef.current.rotation.y += dt * 0.6;
          break;
        case "train":
          groupRef.current.position.x = position[0] + Math.sin(t * 2.0) * 0.18;
          break;
        case "cloud":
          groupRef.current.rotation.y += dt * 0.7;
          break;
        case "bowl":
          groupRef.current.rotation.y += dt * 1.6;
          break;
        case "film":
          groupRef.current.rotation.y += dt * 2.2;
          break;
        case "pen":
          groupRef.current.rotation.z = Math.sin(t * 2.8) * 0.15;
          break;
        case "camera":
          groupRef.current.rotation.y = Math.sin(t * 1.6) * 0.35;
          break;
        default:
          groupRef.current.rotation.y += dt * 1.2;
      }
    } else {
      groupRef.current.rotation.y *= 0.95;
      groupRef.current.rotation.z *= 0.92;
    }
  });

  const emissiveIntensity = isRunning ? 1.3 : isDone ? 0.25 : isError ? 0.6 : 0.0;
  const emissive = isError ? "#dc2626" : isDone ? "#10b981" : avatar.glow;

  const floatProps = isRunning
    ? { speed: 3, rotationIntensity: 0, floatIntensity: 1.2 }
    : { speed: 1.2, rotationIntensity: 0.15, floatIntensity: 0.4 };

  return (
    <group position={position}>
      <Float {...floatProps}>
        <group ref={groupRef}>
          <Shape shape={avatar.shape} color={avatar.color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          {isRunning && (
            <Sparkles
              count={18}
              scale={1.6}
              size={3.2}
              speed={0.6}
              opacity={0.9}
              color={avatar.glow}
              noise={1.2}
            />
          )}
          {isDone && (
            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 0.78, 32]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
            </mesh>
          )}
        </group>
      </Float>
      <Text
        position={[0, -1.05, 0]}
        fontSize={0.22}
        color={isRunning ? avatar.glow : "#1c1b1f"}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.012}
        outlineColor="#faf7f2"
      >
        {avatar.label}
      </Text>
    </group>
  );
}

function Shape({ shape, color, emissive, emissiveIntensity }: { shape: AgentAvatar["shape"]; color: string; emissive: string; emissiveIntensity: number }) {
  const matProps = useMemo(() => ({ color, emissive, emissiveIntensity, roughness: 0.45, metalness: 0.15 }), [color, emissive, emissiveIntensity]);

  switch (shape) {
    case "lantern":
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.55, 24, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.18, 8]} />
            <meshStandardMaterial color="#1c1b1f" />
          </mesh>
        </group>
      );
    case "scroll":
      return (
        <group rotation={[0.25, 0.4, 0]}>
          <mesh>
            <cylinderGeometry args={[0.35, 0.35, 1.2, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 24]} />
            <meshStandardMaterial color="#bd0029" />
          </mesh>
          <mesh position={[0, -0.62, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 24]} />
            <meshStandardMaterial color="#bd0029" />
          </mesh>
        </group>
      );
    case "magnifier":
      return (
        <group rotation={[0, 0, 0.7]}>
          <mesh>
            <torusGeometry args={[0.45, 0.08, 16, 32]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.65, -0.65, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.07, 0.07, 0.65, 16]} />
            <meshStandardMaterial color="#1c1b1f" />
          </mesh>
          <mesh>
            <circleGeometry args={[0.38, 24]} />
            <meshStandardMaterial color="#e0f2fe" transparent opacity={0.35} />
          </mesh>
        </group>
      );
    case "pen":
      return (
        <group rotation={[0, 0, Math.PI / 4]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 1.1, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <coneGeometry args={[0.1, 0.2, 16]} />
            <meshStandardMaterial color="#bd0029" emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        </group>
      );
    case "camera":
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.95, 0.7, 0.45]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0, 0.24]}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} rotation-x={Math.PI / 2} />
            <meshStandardMaterial color="#1c1b1f" />
          </mesh>
          <mesh position={[0.3, 0.2, 0.24]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
          </mesh>
        </group>
      );
    case "airplane":
      return (
        <group rotation={[0, 0, -0.3]}>
          <mesh>
            <coneGeometry args={[0.18, 1.1, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.05, 0.5]}>
            <boxGeometry args={[1.4, 1, 1]} />
            <meshStandardMaterial color="#bd0029" emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        </group>
      );
    case "pagoda":
      return (
        <group>
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.85, 0.25, 0.85]} />
            <meshStandardMaterial color="#1c1b1f" />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.65, 0.35, 0.65]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.85, 0.12, 0.85]} />
            <meshStandardMaterial color="#1c1b1f" />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.5, 0.32, 0.5]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <coneGeometry args={[0.35, 0.4, 4]} />
            <meshStandardMaterial color="#1c1b1f" />
          </mesh>
        </group>
      );
    case "cloud":
      return (
        <group>
          <mesh position={[-0.25, 0, 0]}>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.2, 0.05, 0]}>
            <sphereGeometry args={[0.36, 16, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.35, 0.4, 0.3]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive={emissive} emissiveIntensity={emissiveIntensity * 1.5} />
          </mesh>
        </group>
      );
    case "train":
      return (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <capsuleGeometry args={[0.32, 0.6, 8, 16]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <boxGeometry args={[0.2, 0.05, 0.55]} />
            <meshStandardMaterial color="#bd0029" emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        </group>
      );
    case "bowl":
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.55, 24, 24, 0, Math.PI * 2, Math.PI / 2.2, Math.PI / 2]} />
            <meshStandardMaterial {...matProps} side={2} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.02, 24]} />
            <meshStandardMaterial color="#bd0029" emissive={emissive} emissiveIntensity={emissiveIntensity * 0.6} />
          </mesh>
        </group>
      );
    case "book":
      return (
        <group rotation={[Math.PI / 3, 0, 0]}>
          <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.55, 0.05, 0.75]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.55, 0.05, 0.75]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[1.2, 0.1, 0.78]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      );
    case "coin":
      return (
        <group rotation={[0.4, 0.2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity * 0.8} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.02, 24]} />
            <meshStandardMaterial color="#bd0029" />
          </mesh>
        </group>
      );
    case "film":
      return (
        <group rotation={[0, 0, 0.25]}>
          <mesh>
            <boxGeometry args={[1.1, 0.55, 0.05]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {[-0.4, 0, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 0, 0.03]}>
              <boxGeometry args={[0.25, 0.35, 0.02]} />
              <meshStandardMaterial color="#a78bfa" emissive={emissive} emissiveIntensity={emissiveIntensity} />
            </mesh>
          ))}
        </group>
      );
    default:
      return (
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      );
  }
}
