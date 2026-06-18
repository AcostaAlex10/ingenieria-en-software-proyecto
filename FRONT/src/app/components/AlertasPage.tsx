import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AlertTriangle, TrendingDown, DollarSign, Activity, Eye } from "lucide-react";
import { AlertasTipoChart, DesviacionAvanceChart } from "./ChartsPanel";

interface Alerta {
  id: string;
  tipo: "desvio_avance" | "sobrecosto" | "consumo_anomalo" | "presupuesto";
  proyecto: string;
  descripcion: string;
  gravedad: "baja" | "media" | "alta" | "critica";
  fecha: string;
  estado: "activa" | "resuelta";
  valor?: string;
}

export default function AlertasPage() {
  const alertas: Alerta[] = [
    {
      id: "1",
      tipo: "desvio_avance",
      proyecto: "Edificio Residencial Los Pinos",
      descripcion: "El avance real (45%) es inferior al avance planificado (60%)",
      gravedad: "alta",
      fecha: "2026-06-04",
      estado: "activa",
      valor: "-15%"
    },
    {
      id: "2",
      tipo: "sobrecosto",
      proyecto: "Obra Vial Ruta 14",
      descripcion: "Se excedió el presupuesto de materiales en $450,000",
      gravedad: "critica",
      fecha: "2026-06-03",
      estado: "activa",
      valor: "$450,000"
    },
    {
      id: "3",
      tipo: "consumo_anomalo",
      proyecto: "Puente Posadas-Encarnación",
      descripcion: "Consumo de combustible 30% superior al rendimiento esperado",
      gravedad: "media",
      fecha: "2026-06-02",
      estado: "activa",
      valor: "+30%"
    },
    {
      id: "4",
      tipo: "presupuesto",
      proyecto: "Edificio Residencial Los Pinos",
      descripcion: "Desviación presupuestaria detectada: gastos ejecutados superan lo planificado",
      gravedad: "alta",
      fecha: "2026-06-01",
      estado: "resuelta",
      valor: "$280,000"
    },
  ];

  const getGravedadBadge = (gravedad: Alerta["gravedad"]) => {
    const badges = {
      baja: <Badge variant="outline" style={{ background: "#3b82f615", color: "#3b82f6", borderColor: "#3b82f640" }}>Baja</Badge>,
      media: <Badge style={{ background: "#e8981e", color: "#0b0e15" }}>Media</Badge>,
      alta: <Badge style={{ background: "#f97316", color: "#0b0e15" }}>Alta</Badge>,
      critica: <Badge variant="destructive">Crítica</Badge>,
    };
    return badges[gravedad];
  };

  const getTipoIcon = (tipo: Alerta["tipo"]) => {
    const icons = {
      desvio_avance: <TrendingDown className="w-5 h-5" style={{ color: "#f97316" }} />,
      sobrecosto: <DollarSign className="w-5 h-5" style={{ color: "#ef4444" }} />,
      consumo_anomalo: <Activity className="w-5 h-5" style={{ color: "#e8981e" }} />,
      presupuesto: <AlertTriangle className="w-5 h-5" style={{ color: "#a855f7" }} />,
    };
    return icons[tipo];
  };

  const getTipoLabel = (tipo: Alerta["tipo"]) => {
    const labels = {
      desvio_avance: "Desvío de Avance",
      sobrecosto: "Sobrecosto",
      consumo_anomalo: "Consumo Anómalo",
      presupuesto: "Desviación Presupuestaria",
    };
    return labels[tipo];
  };

  const alertasActivas = alertas.filter(a => a.estado === "activa");
  const alertasResueltas = alertas.filter(a => a.estado === "resuelta");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Análisis y Alertas</h2>
        <p className="text-muted-foreground mt-2">
          Calcular desviaciones y generar alertas automáticas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Activas</p>
                <p className="text-3xl font-bold text-foreground mt-2">{alertasActivas.length}</p>
              </div>
              <div className="bg-secondary p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6" style={{ color: "#ef4444" }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Críticas</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {alertasActivas.filter(a => a.gravedad === "critica").length}
                </p>
              </div>
              <div className="bg-secondary p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6" style={{ color: "#ef4444" }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resueltas</p>
                <p className="text-3xl font-bold text-foreground mt-2">{alertasResueltas.length}</p>
              </div>
              <div className="bg-secondary p-3 rounded-lg">
                <Activity className="w-6 h-6" style={{ color: "#22c55e" }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground mt-2">{alertas.length}</p>
              </div>
              <div className="bg-secondary p-3 rounded-lg">
                <DollarSign className="w-6 h-6" style={{ color: "#3b82f6" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts de análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertasTipoChart />
        <DesviacionAvanceChart />
      </div>

      {/* Alertas Activas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: "#ef4444" }} />
            Alertas Activas
          </CardTitle>
          <CardDescription>
            Notificaciones que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alertasActivas.map((alerta) => (
              <div key={alerta.id} className="p-4 border-l-4 border-red-600 bg-secondary rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="mt-1">{getTipoIcon(alerta.tipo)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">{getTipoLabel(alerta.tipo)}</h4>
                        {getGravedadBadge(alerta.gravedad)}
                        {alerta.valor && (
                          <Badge variant="outline" className="font-mono">{alerta.valor}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-card-foreground mb-2">{alerta.descripcion}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium">{alerta.proyecto}</span>
                        <span>•</span>
                        <span>{new Date(alerta.fecha).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" style={{ color: "#22c55e" }}>
                      Resolver
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {alertasActivas.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay alertas activas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipos de Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alerta de Desvío de Avance</CardTitle>
            <CardDescription>Se genera cuando el avance real es inferior al planificado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Monitoreado automáticamente", "Comparación diaria con planificación", "Notificación a responsables"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alerta de Sobrecostos</CardTitle>
            <CardDescription>Se activa cuando se exceden cantidades presupuestadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Control de materiales asignados", "Validación de presupuesto", "Alerta a gerencia del proyecto"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-red-600 rounded-full" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Desviación Presupuesto vs Avance</CardTitle>
            <CardDescription>Detecta diferencias entre gasto ejecutado y avance físico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Análisis de eficiencia económica", "Cálculo automático de desviaciones", "Generación de informes"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Consumo Anómalo</CardTitle>
            <CardDescription>Identifica consumos inconsistentes respecto al rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Monitoreo de recursos", "Comparación con patrones esperados", "Detección de ineficiencias"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Resueltas */}
      {alertasResueltas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas Resueltas</CardTitle>
            <CardDescription>Historial de alertas atendidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertasResueltas.map((alerta) => (
                <div key={alerta.id} className="p-4 border rounded-lg bg-gray-50 opacity-75">
                  <div className="flex gap-4">
                    <div className="mt-1">{getTipoIcon(alerta.tipo)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-foreground">{getTipoLabel(alerta.tipo)}</h4>
                        <Badge variant="outline" className="bg-secondary border-border" style={{ color: "#22c55e" }}>Resuelta</Badge>
                      </div>
                      <p className="text-sm text-card-foreground mb-2">{alerta.descripcion}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium">{alerta.proyecto}</span>
                        <span>•</span>
                        <span>{new Date(alerta.fecha).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
