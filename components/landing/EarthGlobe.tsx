"use client";
import { useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";

export interface Destination {
  id: string;
  label: string;
  lat: number;
  lng: number;
  active?: boolean;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoFeature = { properties?: { name?: string }; geometry?: any };

const COUNTRIES_URL = "https://unpkg.com/three-globe/example/country-polygons/ne_110m_admin_0_countries.geojson";

function creamTextureDataUrl(): string {
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  // Soft cream with a faint warm gradient — feels like paper, not paint
  const g = ctx.createLinearGradient(0, 0, 64, 64);
  g.addColorStop(0, "#f7f0dd");
  g.addColorStop(1, "#efdfb8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  // Subtle warm noise
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * 64;
    const y = Math.random() * 64;
    const a = 0.02 + Math.random() * 0.04;
    ctx.fillStyle = `rgba(189,0,41,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
  return c.toDataURL("image/png");
}

export const EarthGlobe = forwardRef<EarthGlobeHandle, Props>(function EarthGlobe(
  { destinations, onSelect, height = 560, autoRotateSpeed = 0.35 },
  ref
) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods>(undefined as unknown as GlobeMethods);
  const [countries, setCountries] = useState<GeoFeature[]>([]);
  const [width, setWidth] = useState<number>(0);
  const creamUrl = useMemo(() => creamTextureDataUrl(), []);

  // Track container width so the globe renders at the right size (not window width)
  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => setWidth(el.clientWidth || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(COUNTRIES_URL)
      .then((r) => r.json())
      .then((data: { features?: GeoFeature[] }) => {
        if (cancelled) return;
        setCountries(data?.features ?? []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls() as unknown as {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
      enablePan: boolean;
      minPolarAngle: number;
      maxPolarAngle: number;
    };
    controls.autoRotate = true;
    controls.autoRotateSpeed = autoRotateSpeed;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI - Math.PI / 3.5;
    g.pointOfView({ lat: 22, lng: 110, altitude: 2.0 }, 0);
  }, [autoRotateSpeed]);

  useImperativeHandle(ref, () => ({
    async flyTo(dest, durationMs = 1600) {
      const g = globeRef.current;
      if (!g) return;
      (g.controls() as unknown as { autoRotate: boolean }).autoRotate = false;
      g.pointOfView({ lat: dest.lat, lng: dest.lng, altitude: 0.7 }, durationMs);
      await new Promise((r) => setTimeout(r, durationMs));
    },
  }), []);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height }} className="relative overflow-hidden">
      <Globe
        ref={globeRef}
        width={width || undefined}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor="#bd0029"
        atmosphereAltitude={0.12}

        globeImageUrl={creamUrl}

        polygonsData={countries}
        polygonAltitude={0.006}
        polygonCapColor={() => "rgba(28, 27, 31, 0.08)"}
        polygonSideColor={() => "rgba(28, 27, 31, 0.04)"}
        polygonStrokeColor={() => "rgba(28, 27, 31, 0.26)"}

        pointsData={destinations}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d) => ((d as Destination).active ? "#bd0029" : "rgba(28, 27, 31, 0.45)")}
        pointAltitude={(d) => ((d as Destination).active ? 0.025 : 0.012)}
        pointRadius={(d) => ((d as Destination).active ? 0.55 : 0.35)}
        pointLabel={(d) => {
          const dest = d as Destination;
          return `<div style="font-family:Inter,sans-serif;font-size:12px;padding:6px 10px;background:#ffffff;border-radius:10px;border:1px solid rgba(28,27,31,0.08);color:#1c1b1f;box-shadow:0 8px 24px rgba(28,27,31,0.10);white-space:nowrap">${dest.label}</div>`;
        }}
        onPointClick={(d) => onSelect(d as Destination)}

        ringsData={destinations.filter((d) => d.active)}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => (t: number) => `rgba(189, 0, 41, ${0.85 * (1 - t)})`}
        ringMaxRadius={2.4}
        ringPropagationSpeed={1.4}
        ringRepeatPeriod={1500}
      />
    </div>
  );
});
