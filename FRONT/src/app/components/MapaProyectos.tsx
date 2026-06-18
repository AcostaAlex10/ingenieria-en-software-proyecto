import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/leaflet-custom.css";

// Coordenadas de Oberá, Misiones, Argentina
const OBERA_CENTER: [number, number] = [-27.4863, -55.1208];

// Proyectos simulados con ubicaciones en Oberá
const proyectos = [
  {
    nombre: "Obra Vial Ruta 14",
    coordenadas: [-27.4763, -55.1108] as [number, number],
    avance: 72,
    estado: "En ejecución",
    presupuesto: "$13.2M",
  },
  {
    nombre: "Edificio Los Pinos",
    coordenadas: [-27.4963, -55.1308] as [number, number],
    avance: 45,
    estado: "Demorado",
    presupuesto: "$7.9M",
  },
  {
    nombre: "Puente Posadas-Encarnación",
    coordenadas: [-27.4663, -55.1008] as [number, number],
    avance: 88,
    estado: "En ejecución",
    presupuesto: "$19.5M",
  },
  {
    nombre: "Centro Comercial Norte",
    coordenadas: [-27.5063, -55.1408] as [number, number],
    avance: 61,
    estado: "Alerta",
    presupuesto: "$16.8M",
  },
  {
    nombre: "Complejo Deportivo Municipal",
    coordenadas: [-27.4863, -55.1108] as [number, number],
    avance: 94,
    estado: "Finalizando",
    presupuesto: "$8.1M",
  },
];

// Mapeo de estado a color
const estadoColor: Record<string, string> = {
  "En ejecución": "#22c55e",
  "Demorado": "#ef4444",
  "Alerta": "#e8981e",
  "Finalizando": "#3b82f6",
};

export default function MapaProyectos() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Crear el mapa
    const map = L.map(mapContainerRef.current, {
      center: OBERA_CENTER,
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    // Capa de mapa con estilo oscuro
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Agregar marcadores para cada proyecto
    proyectos.forEach((proyecto) => {
      const color = estadoColor[proyecto.estado] || "#64748b";

      // Crear icono SVG personalizado
      const svgIcon = L.divIcon({
        html: `
          <div style="position: relative;">
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${color}" opacity="0.2" />
              <circle cx="16" cy="16" r="8" fill="${color}" stroke="#0b0e15" stroke-width="2" />
            </svg>
            <div style="
              position: absolute;
              top: -8px;
              left: 50%;
              transform: translateX(-50%);
              background: ${color};
              color: #0b0e15;
              font-size: 9px;
              font-weight: 700;
              padding: 1px 4px;
              border-radius: 2px;
              font-family: 'JetBrains Mono', monospace;
              white-space: nowrap;
            ">
              ${proyecto.avance}%
            </div>
          </div>
        `,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(proyecto.coordenadas, { icon: svgIcon }).addTo(map);

      // Popup al hacer click
      marker.bindPopup(`
        <div style="
          background: #111521;
          border: 1px solid #1e2a42;
          border-radius: 4px;
          padding: 10px;
          min-width: 180px;
          color: #dde3ef;
          font-family: 'Inter', sans-serif;
        ">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 6px; color: #dde3ef;">
            ${proyecto.nombre}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></div>
            <span style="font-size: 11px; color: ${color}; font-weight: 600;">${proyecto.estado}</span>
          </div>
          <div style="font-size: 11px; color: #8a9ab8; margin-bottom: 2px;">
            Avance: <span style="color: ${color}; font-weight: 600; font-family: 'JetBrains Mono', monospace;">${proyecto.avance}%</span>
          </div>
          <div style="font-size: 11px; color: #8a9ab8;">
            Presupuesto: <span style="color: #dde3ef; font-family: 'JetBrains Mono', monospace;">${proyecto.presupuesto}</span>
          </div>
        </div>
      `, {
        closeButton: false,
        className: 'custom-popup'
      });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
              Mapa de Proyectos
            </span>
            <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" }}>
              Oberá, Misiones, Argentina
            </div>
          </div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "var(--secondary)",
              padding: "3px 8px",
              borderRadius: "3px",
              border: "1px solid var(--border)",
            }}
          >
            {proyectos.length} Obras
          </div>
        </div>
      </div>
      <div
        ref={mapContainerRef}
        style={{
          height: "calc(100% - 60px)",
          minHeight: "400px",
        }}
      />
    </div>
  );
}
