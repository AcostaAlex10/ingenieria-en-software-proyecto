import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Plus, Calendar, Users, AlertCircle, Camera, CloudRain } from "lucide-react";
import { toast } from "sonner";

export default function SeguimientoPage() {
  const [avanceData, setAvanceData] = useState({
    proyecto: "",
    fecha: new Date().toISOString().split('T')[0],
    itemTrabajo: "",
    cantidadRealizada: "",
    unidad: "m3"
  });

  const [asistenciaData, setAsistenciaData] = useState({
    proyecto: "",
    fecha: new Date().toISOString().split('T')[0],
    trabajadoresPresentes: "",
    totalTrabajadores: ""
  });

  const [incidenciaData, setIncidenciaData] = useState({
    proyecto: "",
    fecha: new Date().toISOString().split('T')[0],
    tipo: "",
    descripcion: "",
    gravedad: "media"
  });

  const proyectos = [
    "Obra Vial Ruta 14",
    "Edificio Residencial Los Pinos",
    "Puente Posadas-Encarnación"
  ];

  const registrosAvance = [
    {
      id: 1,
      proyecto: "Obra Vial Ruta 14",
      fecha: "2026-06-04",
      item: "Pavimentación asfalto",
      cantidad: 450,
      unidad: "m2",
      estado: "completado"
    },
    {
      id: 2,
      proyecto: "Edificio Residencial Los Pinos",
      fecha: "2026-06-04",
      item: "Hormigonado columnas",
      cantidad: 12,
      unidad: "unidades",
      estado: "completado"
    }
  ];

  const handleRegistrarAvance = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Avance físico registrado correctamente");
    setAvanceData({
      proyecto: "",
      fecha: new Date().toISOString().split('T')[0],
      itemTrabajo: "",
      cantidadRealizada: "",
      unidad: "m3"
    });
  };

  const handleRegistrarAsistencia = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Asistencia registrada correctamente");
    setAsistenciaData({
      proyecto: "",
      fecha: new Date().toISOString().split('T')[0],
      trabajadoresPresentes: "",
      totalTrabajadores: ""
    });
  };

  const handleRegistrarIncidencia = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Incidencia registrada correctamente");
    setIncidenciaData({
      proyecto: "",
      fecha: new Date().toISOString().split('T')[0],
      tipo: "",
      descripcion: "",
      gravedad: "media"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreforegroundound">Seguimiento Operativo</h2>
        <p className="text-muted-foremuted-foregroundound mt-2">
          Registrar avance físico, asistencia e incidencias
        </p>
      </div>

      <Tabs defaultValue="avance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="avance">Avance Físico</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
          <TabsTrigger value="eventos">Eventos Externos</TabsTrigger>
        </TabsList>

        {/* Avance Físico */}
        <TabsContent value="avance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Avance Físico</CardTitle>
                <CardDescription>
                  Actualice el estado de ejecución de la obra mediante métricas específicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistrarAvance} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proyecto-avance">Proyecto</Label>
                    <Select 
                      value={avanceData.proyecto} 
                      onValueChange={(value) => setAvanceData({...avanceData, proyecto: value})}
                      required
                    >
                      <SelectTrigger id="proyecto-avance">
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {proyectos.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-avance">Fecha</Label>
                    <Input
                      id="fecha-avance"
                      type="date"
                      value={avanceData.fecha}
                      onChange={(e) => setAvanceData({...avanceData, fecha: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item">Ítem de Trabajo</Label>
                    <Input
                      id="item"
                      value={avanceData.itemTrabajo}
                      onChange={(e) => setAvanceData({...avanceData, itemTrabajo: e.target.value})}
                      placeholder="Ej: Excavación de zanja"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cantidad">Cantidad Realizada</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        value={avanceData.cantidadRealizada}
                        onChange={(e) => setAvanceData({...avanceData, cantidadRealizada: e.target.value})}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unidad">Unidad</Label>
                      <Select 
                        value={avanceData.unidad} 
                        onValueChange={(value) => setAvanceData({...avanceData, unidad: value})}
                      >
                        <SelectTrigger id="unidad">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="m3">m³</SelectItem>
                          <SelectItem value="m2">m²</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                          <SelectItem value="unidades">Unidades</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Avance
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Historial de Avance */}
            <Card>
              <CardHeader>
                <CardTitle>Últimos Registros</CardTitle>
                <CardDescription>Historial de avance físico</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {registrosAvance.map((registro) => (
                    <div key={registro.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{registro.proyecto}</span>
                        <Badge variant="outline">{registro.estado}</Badge>
                      </div>
                      <p className="text-sm text-muted-foremuted-foregroundound">{registro.item}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foremuted-foregroundound">
                          {registro.cantidad} {registro.unidad}
                        </span>
                        <span className="text-muted-foremuted-foregroundound">
                          {new Date(registro.fecha).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Asistencia */}
        <TabsContent value="asistencia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registrar Asistencia del Personal
              </CardTitle>
              <CardDescription>
                Control de trabajadores presentes en cada jornada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegistrarAsistencia} className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="proyecto-asistencia">Proyecto</Label>
                  <Select 
                    value={asistenciaData.proyecto} 
                    onValueChange={(value) => setAsistenciaData({...asistenciaData, proyecto: value})}
                    required
                  >
                    <SelectTrigger id="proyecto-asistencia">
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {proyectos.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-asistencia">Fecha</Label>
                  <Input
                    id="fecha-asistencia"
                    type="date"
                    value={asistenciaData.fecha}
                    onChange={(e) => setAsistenciaData({...asistenciaData, fecha: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="presentes">Trabajadores Presentes</Label>
                    <Input
                      id="presentes"
                      type="number"
                      value={asistenciaData.trabajadoresPresentes}
                      onChange={(e) => setAsistenciaData({...asistenciaData, trabajadoresPresentes: e.target.value})}
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total">Total de Trabajadores</Label>
                    <Input
                      id="total"
                      type="number"
                      value={asistenciaData.totalTrabajadores}
                      onChange={(e) => setAsistenciaData({...asistenciaData, totalTrabajadores: e.target.value})}
                      min="0"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Registrar Asistencia
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidencias */}
        <TabsContent value="incidencias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Registrar Incidencias
              </CardTitle>
              <CardDescription>
                Documentar problemas, retrasos o situaciones anormales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegistrarIncidencia} className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="proyecto-incidencia">Proyecto</Label>
                  <Select 
                    value={incidenciaData.proyecto} 
                    onValueChange={(value) => setIncidenciaData({...incidenciaData, proyecto: value})}
                    required
                  >
                    <SelectTrigger id="proyecto-incidencia">
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {proyectos.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-incidencia">Fecha</Label>
                  <Input
                    id="fecha-incidencia"
                    type="date"
                    value={incidenciaData.fecha}
                    onChange={(e) => setIncidenciaData({...incidenciaData, fecha: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo-incidencia">Tipo de Incidencia</Label>
                  <Select 
                    value={incidenciaData.tipo} 
                    onValueChange={(value) => setIncidenciaData({...incidenciaData, tipo: value})}
                    required
                  >
                    <SelectTrigger id="tipo-incidencia">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retraso">Retraso</SelectItem>
                      <SelectItem value="falla_equipamiento">Falla de Equipamiento</SelectItem>
                      <SelectItem value="material_faltante">Material Faltante</SelectItem>
                      <SelectItem value="clima">Condición Climática</SelectItem>
                      <SelectItem value="accidente">Accidente</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gravedad">Gravedad</Label>
                  <Select 
                    value={incidenciaData.gravedad} 
                    onValueChange={(value) => setIncidenciaData({...incidenciaData, gravedad: value})}
                  >
                    <SelectTrigger id="gravedad">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={incidenciaData.descripcion}
                    onChange={(e) => setIncidenciaData({...incidenciaData, descripcion: e.target.value})}
                    placeholder="Describa la incidencia en detalle..."
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Registrar Incidencia
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eventos Externos */}
        <TabsContent value="eventos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudRain className="w-5 h-5" />
                Registrar Eventos Externos
              </CardTitle>
              <CardDescription>
                Justificar formalmente extensiones de plazo o retrasos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xl space-y-4">
                <p className="text-sm text-muted-foremuted-foregroundound">
                  Registre eventos climáticos, fallas externas o situaciones ajenas al proyecto que afecten el avance de la obra.
                </p>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Registrar Evento Externo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
