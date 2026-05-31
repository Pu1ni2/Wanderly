"use client";
import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";

export interface Destination {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color?: string;
}

export interface EarthGlobeHandle {
  flyTo: (dest: Destination, durationMs?: number) => Promise<void>;
}

interface Props {
  destinations: Destination[];
  onSelect: (dest: Destination) => void;
  height?: number;
  autoRotateSpeed?: number;
}

export const EarthGlobe = forwardRef<EarthGlobeHandle, Props>(function EarthGlobe(
  { destinations, onSelect, height = 560, autoRotateSpeed = 0.45 },
  ref
) {
  const globeRef = useRef<GlobeMethods>(undefined as unknown as GlobeMethods);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = autoRotateSpeed;
    controls.enableZoom = false;
    g.pointOfView({ lat: 25, lng: 30, altitude: 2.2 }, 0);
  }, [autoRotateSpeed]);

  useImperativeHandle(ref, () => ({
    async flyTo(dest, durationMs = 1800) {
      const g = globeRef.current;
      if (!g) return;
      g.controls().autoRotate = false;
      g.pointOfView({ lat: dest.lat, lng: dest.lng, altitude: 0.6 }, durationMs);
      await new Promise((r) => setTimeout(r, durationMs));
    },
  }), []);

  return (
    <div style={{ width: "100%", height }} className="relative">
      <Globe
        ref={globeRef}
        width={undefined}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor="#bd0029"
        atmosphereAltitude={0.18}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        pointsData={destinations}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d) => (d as Destination).color ?? "#bd0029"}
        pointAltitude={0.018}
        pointRadius={0.55}
        pointLabel={(d) => `<div style="font-family:Inter,sans-serif;font-size:12px;padding:4px 8px;background:#fff;border-radius:8px;border:1px solid rgba(0,0,0,0.08);color:#1c1b1f;box-shadow:0 4px 14px rgba(0,0,0,0.08)">${(d as Destination).label}</div>`}
        onPointClick={(d) => onSelect(d as Destination)}
        ringsData={destinations}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => (t: number) => `rgba(189, 0, 41, ${1 - t})`}
        ringMaxRadius={2.5}
        ringPropagationSpeed={1.5}
        ringRepeatPeriod={1400}
      />
    </div>
  );
});
