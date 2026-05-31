"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import type * as THREE from "three";
import { Mascot } from "./Mascot";
import { AGENT_AVATARS, type AgentAvatar } from "./agents";
import { useAgentStatus } from "./AgentStatusContext";

// Lay mascots out on a gentle arc in two rows: orchestration+review back, specialists front.
function layout(): Array<{ avatar: AgentAvatar; position: [number, number, number] }> {
  const back = AGENT_AVATARS.filter((a) => a.group === "orchestration" || a.group === "review");
  const front = AGENT_AVATARS.filter((a) => a.group === "specialist");

  const backArc = back.map((a, i) => {
    const t = back.length === 1 ? 0.5 : i / (back.length - 1);
    const x = (t - 0.5) * 6.5;
    const z = -1.4 + Math.abs(t - 0.5) * 0.6;
    return { avatar: a, position: [x, 0.9, z] as [number, number, number] };
  });
  const frontArc = front.map((a, i) => {
    const t = front.length === 1 ? 0.5 : i / (front.length - 1);
    const x = (t - 0.5) * 8.5;
    const z = 1.2 - Math.abs(t - 0.5) * 0.4;
    return { avatar: a, position: [x, 0, z] as [number, number, number] };
  });
  return [...backArc, ...frontArc];
}

function CameraDolly({ active }: { active: boolean }) {
  const ref = useRef<THREE.PerspectiveCamera>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    const targetX = active ? Math.sin(t * 0.4) * 0.6 : 0;
    const targetY = active ? 2.4 + Math.sin(t * 0.3) * 0.15 : 2.4;
    ref.current.position.x += (targetX - ref.current.position.x) * 0.04;
    ref.current.position.y += (targetY - ref.current.position.y) * 0.04;
    ref.current.lookAt(0, 0.3, 0);
  });
  return <PerspectiveCamera ref={ref} makeDefault position={[0, 2.4, 6.5]} fov={42} />;
}

export function AgentStage({ height = 320 }: { height?: number }) {
  const { statusOf, running } = useAgentStatus();
  const items = layout();

  return (
    <div
      className="rounded-3xl border overflow-hidden relative"
      style={{
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-md)",
        height,
        background: "radial-gradient(ellipse at 50% 110%, #f7d6e0 0%, #f7efde 35%, #f4ecdc 70%, #ebe0c1 100%)",
      }}
    >
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, preserveDrawingBuffer: false }} shadows>
        <CameraDolly active={running} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 5]} intensity={1.0} castShadow />
        <directionalLight position={[-5, 3, 2]} intensity={0.3} color={"#bd0029"} />
        <Environment preset="apartment" environmentIntensity={0.5} />

        {/* Floor — contact shadow gives mascots weight */}
        <ContactShadows
          position={[0, -0.95, 0]}
          opacity={0.42}
          scale={18}
          blur={2.2}
          far={4}
          resolution={512}
          color="#1c1b1f"
        />

        {items.map(({ avatar, position }) => (
          <Mascot key={avatar.name} avatar={avatar} position={position} status={statusOf(avatar.name)} />
        ))}
      </Canvas>
    </div>
  );
}
