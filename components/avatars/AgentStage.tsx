"use client";
import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
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

export function AgentStage({ height = 320 }: { height?: number }) {
  const { statusOf } = useAgentStatus();
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
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, preserveDrawingBuffer: false }}>
        <PerspectiveCamera makeDefault position={[0, 2.4, 6.5]} fov={42} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} castShadow={false} />
        <directionalLight position={[-5, 3, 2]} intensity={0.3} color={"#bd0029"} />
        <Environment preset="apartment" environmentIntensity={0.5} />
        {items.map(({ avatar, position }) => (
          <Mascot key={avatar.name} avatar={avatar} position={position} status={statusOf(avatar.name)} />
        ))}
      </Canvas>
    </div>
  );
}
