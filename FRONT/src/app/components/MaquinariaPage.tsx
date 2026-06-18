import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Wrench, Plus, AlertCircle, Clock, Fuel } from "lucide-react";
import { toast } from "sonner";

interface Maquina {
  id: string;
  nombre: string;
  tipo: string;
  estado: "operativa" | "mantenimiento" | "reparacion";
  horasUso: number;
  proximoMantenimiento: number;
  proyecto?: string;
}

export default function MaquinariaPage() {
  const [maquinas] = useState<Maquina[]>([
    {
      id: "1",
      nombre: "Excavadora CAT 320",
      tipo: "Excavadora",
      estado: "operativa",
      horasUso: 2450,
      proximoMantenimiento: 2500,
      proyecto: "Obra Vial Ruta 14"
    },
    {
      id: "2",
      nombre: "Mezcladora Hormigón HM-500",
      tipo: "Mezcladora",
      estado: "operativa",
      horasUso: 1200,
      proximoMantenimiento: 1500,
      proyecto: "Edificio Residencial Los Pinos"
    },
    {
      id: "3",
      nombre: "Grúa Torre TG-200",
      tipo: "Grúa",
      estado: "mantenimiento",
      horasUso: 3800,
      proximoMantenimiento: 3600,
      proyecto: "Edificio Residencial Los Pinos"
    },
    {
      id: "4",
      nombre: "Compactadora Vibratoria CV-100",
      tipo: "Compactadora",
      estado: "operativa",
      horasUso: 890,
      proximoMantenimiento: 1000,
      proyecto: "Obra Vial Ruta 14"
    },
  ]);

  const [registroUso, setRegistroUso] = useState({
    maquina: "",
    fecha: new Date().toISOString().split('T')[0],
    horasTrabajadas: "",
    combustible: "",
    produccion: ""
  });

  const historialFallas = [
    {
      id: "1",
      maquina: "Excavadora CAT 320",
      fecha: "2026-05-15",
      descripcion: "Falla en sistema hidráulico",
      componente: "Bomba hidráulica",
      accion: "Reemplazo de componente",
      estado: "resuelta"
    },
    {
      id: "2",
      maquina: "Grúa Torre TG-200",
      fecha: "2026-06-01",
      descripcion: "Desgaste en cable de elevación",
      componente: "Cable de acero",
      accion: "Reemplazo programado",
      estado: "en_proceso"
    },
  ];

  const handleRegistrarUso = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Uso de maquinaria registrado correctamente");
    setRegistroUso({
      maquina: "",
      fecha: new Date().toISOString().split('T')[0],
      horasTrabajadas: "",
      combustible: "",
      produccion: ""
    });
  };

  const getEstadoBadge = (estado: Maquina["estado"]) => {
    const badges = {
      operativa: <Badge className="bg-green-600">Operativa</Badge>,
      mantenimiento: <Badge className="bg-yellow-600">Mantenimiento</Badge>,
      reparacion: <Badge variant="destructive">En Reparación</Badge>,
    };
    return badges[estado];
  };

  const getMantenimientoStatus = (horasUso: number, proximoMantenimiento: number) => {
    const diferencia = proximoMantenimiento - horasUso;
    if (diferencia < 50) return { color: "text-red-600", bg: "bg-sseconcondaryary", label: "Urgente" };
    if (diferencia < 200) return { color: "text-yellow-600", bg: "bg-sseccondaryndary", label: "Próximo" };
    return { color: "text-green-600", bg: "bg-ssecocondarydary", label: "Normal" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreforegroundound">Gestión de Maquinaria</h2>
        <p className="text-muted-foremuted-foregroundound mt-2">
          Registrar uso y mantenimiento de equipos
        </p>
      </div>

      <Tabs defaultValue="registro" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registro">Registro de Uso</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
        </TabsList>

        {/* Registro de Uso */}
        <TabsContent value="registro" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Uso de Maquinaria</CardTitle>
                <CardDescription>
                  Registrar horas de uso, consumo de combustible y producción
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistrarUso} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maquina">Maquinaria</Label>
                    <Select 
                      value={registroUso.maquina} 
                      onValueChange={(value) => setRegistroUso({...registroUso, maquina: value})}
                      required
                    >
                      <SelectTrigger id="maquina">
                        <SelectValue placeholder="Seleccionar maquinaria" />
                      </SelectTrigger>
                      <SelectContent>
                        {maquinas.filter(m => m.estado === "operativa").map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-uso">Fecha</Label>
                    <Input
                      id="fecha-uso"
                      type="date"
                      value={registroUso.fecha}
                      onChange={(e) => setRegistroUso({...registroUso, fecha: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horas">Horas Trabajadas</Label>
                    <Input
                      id="horas"
                      type="number"
                      value={registroUso.horasTrabajadas}
                      onChange={(e) => setRegistroUso({...registroUso, horasTrabajadas: e.target.value})}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="combustible">Combustible Consumido (litros)</Label>
                    <Input
                      id="combustible"
                      type="number"
                      value={registroUso.combustible}
                      onChange={(e) => setRegistroUso({...registroUso, combustible: e.target.value})}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="produccion">Producción Realizada</Label>
                    <Input
                      id="produccion"
                      type="number"
                      value={registroUso.produccion}
                      onChange={(e) => setRegistroUso({...registroUso, produccion: e.target.value})}
                      placeholder="Ej: m³ excavados, cargas transportadas"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Uso
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
                <CardDescription>Casos de uso relacionados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-ssecondarycondary rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Registrar uso de maquinaria</h4>
                  <p className="text-sm text-blue-800">
                    Permite analizar el rendimiento operativo de cada equipo mediante el registro de horas de uso, combustible y producción.
                  </p>
                </div>
                <div className="p-4 bg-ssecocondarydary rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Encargado de taller</h4>
                  <p className="text-sm text-green-800">
                    El encargado de taller registra el uso de maquinaria para analizar su rendimiento operativo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventario */}
        <TabsContent value="inventario" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventario de Maquinaria</CardTitle>
              <CardDescription>
                Estado y ubicación de equipos ({maquinas.length} máquinas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maquinas.map((maquina) => {
                  const mantenimiento = getMantenimientoStatus(maquina.horasUso, maquina.proximoMantenimiento);
                  return (
                    <div key={maquina.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-foreforegroundound">{maquina.nombre}</h4>
                            {getEstadoBadge(maquina.estado)}
                          </div>
                          <p className="text-sm text-muted-foremuted-foregroundound">{maquina.tipo}</p>
                          {maquina.proyecto && (
                            <p className="text-sm text-muted-foremuted-foregroundound mt-1">
                              Asignada a: {maquina.proyecto}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 text-muted-foremuted-foregroundound mb-1">
                            <Clock className="w-4 h-4" />
                            <span>Horas de Uso</span>
                          </div>
                          <p className="font-semibold text-foreforegroundound">{maquina.horasUso} hs</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foremuted-foregroundound mb-1">
                            <Wrench className="w-4 h-4" />
                            <span>Próximo Mantenimiento</span>
                          </div>
                          <p className="font-semibold text-foreforegroundound">{maquina.proximoMantenimiento} hs</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foremuted-foregroundound mb-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>Estado Mantenimiento</span>
                          </div>
                          <Badge className={`${mantenimiento.bg} ${mantenimiento.color} border-0`}>
                            {mantenimiento.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foremuted-foregroundound">Progreso hasta mantenimiento</span>
                          <span className="font-semibold">
                            {maquina.proximoMantenimiento - maquina.horasUso} hs restantes
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              (maquina.horasUso / maquina.proximoMantenimiento) > 0.9 ? 'bg-red-600' :
                              (maquina.horasUso / maquina.proximoMantenimiento) > 0.7 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                            style={{ width: `${Math.min((maquina.horasUso / maquina.proximoMantenimiento) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mantenimiento */}
        <TabsContent value="mantenimiento" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Fallas y Reemplazos</CardTitle>
              <CardDescription>
                Consultar problemas recurrentes y mantenimientos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historialFallas.map((falla) => (
                  <div key={falla.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-foreforegroundound">{falla.maquina}</h4>
                          <Badge variant={falla.estado === "resuelta" ? "outline" : "destructive"}>
                            {falla.estado === "resuelta" ? "Resuelta" : "En Proceso"}
                          </Badge>
                        </div>
                        <p className="text-sm text-card-forecard-foregroundound mb-2">{falla.descripcion}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foremuted-foregroundound">Componente: </span>
                            <span className="font-medium text-foreforegroundound">{falla.componente}</span>
                          </div>
                          <div>
                            <span className="text-muted-foremuted-foregroundound">Acción: </span>
                            <span className="font-medium text-foreforegroundound">{falla.accion}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foremuted-foregroundound mt-2">
                          {new Date(falla.fecha).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <Button className="w-full gap-2" variant="outline">
                  <Plus className="w-4 h-4" />
                  Registrar Falla o Mantenimiento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
