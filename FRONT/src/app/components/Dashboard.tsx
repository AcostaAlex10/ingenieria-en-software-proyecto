import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  FolderKanban,
  Activity,
  AlertTriangle,
  TrendingUp,
  Package,
  FileText,
  Wrench,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Link } from "react-router";
import {
  AvanceMensualChart,
  PresupuestoChart,
  DistribucionProyectosChart,
  RendimientoRadarChart,
} from "./ChartsPanel";
// import MapaProyectos from "./MapaProyectos";

const stats = [
  {
    label: "Proyectos Activos",
    value: "8",
    delta: "+2",
    deltaDir: "up",
    sub: "este mes",
    icon: FolderKanban,
    accent: "#3b82f6",
  },
  {
    label: "Obras en Ejecución",
    value: "6",
    delta: "75%",
    deltaDir: "neutral",
    sub: "completado prom.",
    icon: Activity,
    accent: "#22c55e",
  },
  {
    label: "Alertas Activas",
    value: "3",
    delta: "+1",
    deltaDir: "down",
    sub: "vs. semana ant.",
    icon: AlertTriangle,
    accent: "#ef4444",
  },
  {
    label: "Avance Promedio",
    value: "68%",
    delta: "+12%",
    deltaDir: "up",
    sub: "vs. planificado",
    icon: TrendingUp,
    accent: "#e8981e",
  },
];

const modules = [
  { title: "Proyectos", desc: "Registro y organización de obras", icon: FolderKanban, link: "/proyectos", accent: "#3b82f6" },
  { title: "Seguimiento", desc: "Avance físico, asistencia, incidencias", icon: Activity, link: "/seguimiento", accent: "#22c55e" },
  { title: "Materiales", desc: "Asignación y control de consumo", icon: Package, link: "/materiales", accent: "#f97316" },
  { title: "Documentación", desc: "Archivos y documentos de obra", icon: FileText, link: "/documentacion", accent: "#6366f1" },
  { title: "Reportes", desc: "Revisión y aprobación de reportes", icon: FileText, link: "/reportes", accent: "#a855f7" },
  { title: "Alertas", desc: "Desviaciones y notificaciones", icon: AlertTriangle, link: "/alertas", accent: "#ef4444" },
  { title: "Maquinaria", desc: "Uso y mantenimiento de equipos", icon: Wrench, link: "/maquinaria", accent: "#64748b" },
];

const activities = [
  { action: "Nuevo proyecto registrado", project: "Obra Vial Ruta 14", time: "02:14", type: "ok" },
  { action: "Alerta de desvío presupuestario", project: "Edificio Los Pinos", time: "04:32", type: "warn" },
  { action: "Avance físico actualizado", project: "Puente Posadas-Encarnación", time: "06:18", type: "info" },
  { action: "Consumo de materiales excedido", project: "Centro Comercial Norte", time: "08:05", type: "err" },
  { action: "Reporte diario aprobado", project: "Complejo Deportivo Municipal", time: "1d", type: "ok" },
];

const proyectos = [
  { nombre: "Obra Vial Ruta 14", avance: 72, estado: "En ejecución", presup: "$13.2M", delta: "+10%", dir: "up" },
  { nombre: "Edificio Los Pinos", avance: 45, estado: "Demorado", presup: "$7.9M", delta: "-15%", dir: "down" },
  { nombre: "Puente Posadas-Enc.", avance: 88, estado: "En ejecución", presup: "$19.5M", delta: "+3%", dir: "up" },
  { nombre: "Centro Comercial Norte", avance: 61, estado: "Alerta", presup: "$16.8M", delta: "-8%", dir: "down" },
  { nombre: "Complejo Deportivo", avance: 94, estado: "Finalizando", presup: "$8.1M", delta: "+2%", dir: "up" },
];

function StatCard({ stat }: { stat: typeof stats[0] }) {
  const Icon = stat.icon;
  const DeltaIcon = stat.deltaDir === "up" ? ArrowUpRight : stat.deltaDir === "down" ? ArrowDownRight : Minus;
  const deltaColor = stat.deltaDir === "up" ? "#22c55e" : stat.deltaDir === "down" ? "#ef4444" : "#64748b";
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "3px",
          height: "100%",
          background: stat.accent,
          borderRadius: "var(--radius) 0 0 var(--radius)",
        }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1,
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: "8px",
            }}
          >
            {stat.value}
          </div>
          <div className="flex items-center gap-1">
            <DeltaIcon style={{ width: "12px", height: "12px", color: deltaColor }} />
            <span style={{ fontSize: "11px", color: deltaColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
              {stat.delta}
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted-foreground)", marginLeft: "2px" }}>
              {stat.sub}
            </span>
          </div>
        </div>
        <div
          style={{
            width: "36px",
            height: "36px",
            background: `${stat.accent}18`,
            border: `1px solid ${stat.accent}30`,
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon style={{ width: "16px", height: "16px", color: stat.accent }} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, accent }: { value: number; accent: string }) {
  const color =
    value >= 80 ? "#22c55e" :
    value >= 60 ? "#e8981e" :
    value >= 40 ? "#f97316" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          flex: 1,
          height: "4px",
          background: "var(--secondary)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: "2px",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: color,
          fontFamily: "'JetBrains Mono', monospace",
          width: "30px",
          textAlign: "right",
        }}
      >
        {value}%
      </span>
    </div>
  );
}

export default function Dashboard() {
  const activityDot: Record<string, string> = { ok: "#22c55e", warn: "#e8981e", info: "#3b82f6", err: "#ef4444" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
              Panel de Control
            </h2>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--primary)",
                background: "rgba(232,152,30,0.15)",
                border: "1px solid rgba(232,152,30,0.3)",
                borderRadius: "3px",
                padding: "2px 8px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
              }}
            >
              PRO V1.0
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
            Sistema de Gestión y Seguimiento Operativo — actualizado ahora
          </p>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--muted-foreground)",
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            padding: "4px 10px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={i} stat={s} />)}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AvanceMensualChart />
        <PresupuestoChart />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistribucionProyectosChart />
        <RendimientoRadarChart />
      </div>

      {/* Mapa de proyectos */}
      {/* <div style={{ height: "500px" }}>
        <MapaProyectos />
      </div> */}

      {/* Bottom grid: tabla proyectos + actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tabla proyectos */}
        <div
          className="lg:col-span-2"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
              Estado de Obras
            </span>
            <Link
              to="/proyectos"
              style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600, letterSpacing: "0.02em" }}
            >
              Ver todos →
            </Link>
          </div>
          <div>
            {/* Header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "1fr 130px 80px 70px 60px",
                padding: "8px 18px",
                borderBottom: "1px solid var(--border)",
                background: "var(--secondary)",
              }}
            >
              {["Proyecto", "Estado", "Avance", "Presup.", "Δ"].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "var(--muted-foreground)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            {proyectos.map((p, i) => {
              const estadoColor =
                p.estado === "En ejecución" ? "#22c55e" :
                p.estado === "Demorado" ? "#ef4444" :
                p.estado === "Alerta" ? "#e8981e" :
                p.estado === "Finalizando" ? "#3b82f6" : "#64748b";
              const DIcon = p.dir === "up" ? ArrowUpRight : ArrowDownRight;
              const dColor = p.dir === "up" ? "#22c55e" : "#ef4444";
              return (
                <div
                  key={i}
                  className="grid"
                  style={{
                    gridTemplateColumns: "1fr 130px 80px 70px 60px",
                    padding: "11px 18px",
                    borderBottom: i < proyectos.length - 1 ? "1px solid var(--border)" : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground)" }}>
                    {p.nombre}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: estadoColor, flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", color: estadoColor, fontWeight: 600 }}>{p.estado}</span>
                  </div>
                  <ProgressBar value={p.avance} accent={estadoColor} />
                  <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {p.presup}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <DIcon style={{ width: "11px", height: "11px", color: dColor }} />
                    <span style={{ fontSize: "11px", color: dColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      {p.delta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actividad reciente */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}
        >
          <div
            style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
              Actividad Reciente
            </span>
          </div>
          <div style={{ padding: "6px 0" }}>
            {activities.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3"
                style={{
                  padding: "10px 18px",
                  borderBottom: i < activities.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: activityDot[a.type],
                    marginTop: "5px",
                    flexShrink: 0,
                    boxShadow: `0 0 5px ${activityDot[a.type]}80`,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground)", marginBottom: "2px" }}>
                    {a.action}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {a.project}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--muted-foreground)",
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  -{a.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--muted-foreground)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Acceso Rápido — Módulos
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <Link
                key={i}
                to={m.link}
                className="flex flex-col items-center gap-2 rounded-sm transition-all duration-100 group"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  padding: "14px 10px",
                  textAlign: "center",
                  textDecoration: "none",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = m.accent;
                  (e.currentTarget as HTMLElement).style.background = `${m.accent}10`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.background = "var(--card)";
                }}
              >
                <Icon style={{ width: "18px", height: "18px", color: m.accent }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3 }}>
                  {m.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
