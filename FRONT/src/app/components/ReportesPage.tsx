import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { FileText, Download, Eye, Edit, Check, X, BarChart3 } from "lucide-react";
import { AvanceMensualChart, PresupuestoChart, DesviacionAvanceChart, ConsumoMaterialesChart } from "./ChartsPanel";

interface Reporte {
  id: string;
  proyecto: string;
  fecha: string;
  tipo: string;
  estado: "pendiente" | "revision" | "aprobado" | "rechazado";
  creador: string;
}

export default function ReportesPage() {
  const reportes: Reporte[] = [
    {
      id: "1",
      proyecto: "Obra Vial Ruta 14",
      fecha: "2026-06-04",
      tipo: "Reporte Diario",
      estado: "pendiente",
      creador: "Personal Técnico"
    },
    {
      id: "2",
      proyecto: "Edificio Residencial Los Pinos",
      fecha: "2026-06-03",
      tipo: "Reporte Semanal",
      estado: "revision",
      creador: "Encargado de Obra"
    },
    {
      id: "3",
      proyecto: "Puente Posadas-Encarnación",
      fecha: "2026-06-02",
      tipo: "Reporte Mensual",
      estado: "aprobado",
      creador: "Gerencia"
    },
  ];

  const informesComparativos = [
    { id: "1", nombre: "Comparativa Avance vs Planificado - Mayo 2026", proyecto: "Todos", fecha: "2026-06-01" },
    { id: "2", nombre: "Análisis de Costos - Primer Trimestre", proyecto: "Obra Vial Ruta 14", fecha: "2026-05-28" },
    { id: "3", nombre: "Desempeño de Obras - Consolidado", proyecto: "Todos", fecha: "2026-05-25" },
  ];

  const getEstadoBadge = (estado: Reporte["estado"]) => {
    const badges = {
      pendiente: <Badge variant="secondary">Pendiente</Badge>,
      revision: <Badge className="bg-yellow-600">En Revisión</Badge>,
      aprobado: <Badge className="bg-green-600">Aprobado</Badge>,
      rechazado: <Badge variant="destructive">Rechazado</Badge>,
    };
    return badges[estado];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Reportes y Control</h2>
        <p className="text-muted-foreground mt-2">
          Revisar, editar y aprobar reportes operativos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Pendientes", value: reportes.filter(r => r.estado === "pendiente").length, color: "text-muted-foreground", bg: "bg-gray-50" },
          { label: "En Revisión", value: reportes.filter(r => r.estado === "revision").length, color: "text-yellow-600", bg: "bg-secondary" },
          { label: "Aprobados", value: reportes.filter(r => r.estado === "aprobado").length, color: "text-green-600", bg: "bg-secondary" },
          { label: "Rechazados", value: reportes.filter(r => r.estado === "rechazado").length, color: "text-red-600", bg: "bg-secondary" },
        ].map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <FileText className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts comparativos */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 " style={{ color: "#a855f7" }} />
          Análisis Gráfico Comparativo
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AvanceMensualChart />
          <DesviacionAvanceChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <PresupuestoChart />
          <ConsumoMaterialesChart />
        </div>
      </div>

      {/* Revisar Reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Revisar Reportes</CardTitle>
          <CardDescription>
            Validar la información cargada por el personal de obra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportes.map((reporte) => (
              <div key={reporte.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-foreground">{reporte.proyecto}</h4>
                    {getEstadoBadge(reporte.estado)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{reporte.tipo}</span>
                    <span>•</span>
                    <span>{new Date(reporte.fecha).toLocaleDateString('es-AR')}</span>
                    <span>•</span>
                    <span>Creado por: {reporte.creador}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" title="Ver reporte">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {reporte.estado === "pendiente" || reporte.estado === "revision" ? (
                    <>
                      <Button size="sm" variant="ghost" title="Editar reporte">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="" style={{ color: "#22c55e" }} title="Aprobar reporte">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="" style={{ color: "#ef4444" }} title="Rechazar">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informes Comparativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Generar Informes Comparativos
          </CardTitle>
          <CardDescription>
            Comparar información entre avance planificado y ejecutado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button className="gap-2">
                <FileText className="w-4 h-4" />
                Nuevo Informe Comparativo
              </Button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-foreground">Informes Generados</h4>
              {informesComparativos.map((informe) => (
                <div key={informe.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h5 className="font-medium text-foreground">{informe.nombre}</h5>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{informe.proyecto}</span>
                      <span>•</span>
                      <span>{new Date(informe.fecha).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
