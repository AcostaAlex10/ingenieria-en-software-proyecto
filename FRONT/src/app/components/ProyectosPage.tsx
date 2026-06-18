import { useState, useEffect } from "react";

const API_URL = "http://localhost:3000/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Plus, Search, Edit, Trash2, MapPin, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface Proyecto {
  id: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  encargado: string;
  fechaInicio: string;
  estado: "planificacion" | "en_ejecucion" | "pausada" | "finalizada";
  avance: number;
  presupuesto: number;
}

function mapEstado(estadoDB: string): Proyecto["estado"] {
  const map: Record<string, Proyecto["estado"]> = {
    Creado: "planificacion",
    Planificado: "planificacion",
    EnEjecucion: "en_ejecucion",
    Pausado: "pausada",
    EnRevision: "en_ejecucion",
    Finalizado: "finalizada",
    Cancelado: "finalizada",
  };
  return map[estadoDB] ?? "planificacion";
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
    ubicacion: "",
    fechaInicio: "",
    presupuesto: ""
  });

  useEffect(() => {
    fetch(`${API_URL}/proyectos`)
      .then(res => res.json())
      .then((data: Array<Record<string, unknown>>) => {
        setProyectos(data.map(p => ({
          id: p.id_proyecto as number,
          nombre: p.nombre as string,
          tipo: p.tipo as string,
          ubicacion: p.ubicacion as string,
          encargado: (p.encargado as string) ?? "Sin asignar",
          fechaInicio: p.fecha_inicio as string,
          estado: mapEstado(p.estado as string),
          avance: 0,
          presupuesto: Number(p.presupuesto_estimado),
        })));
      })
      .catch(() => toast.error("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, []);

  const filteredProyectos = proyectos.filter(proyecto =>
    proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proyecto.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/proyectos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          tipo: formData.tipo,
          ubicacion: formData.ubicacion,
          fecha_inicio: formData.fechaInicio,
          presupuesto_estimado: parseFloat(formData.presupuesto),
          id_responsable: 1,
        }),
      });
      if (!res.ok) throw new Error();
      const nuevo = await res.json();
      setProyectos(prev => [...prev, {
        id: nuevo.id_proyecto,
        nombre: nuevo.nombre,
        tipo: nuevo.tipo,
        ubicacion: nuevo.ubicacion,
        encargado: "Admin Sistema",
        fechaInicio: nuevo.fecha_inicio,
        estado: "planificacion",
        avance: 0,
        presupuesto: nuevo.presupuesto_estimado,
      }]);
      setIsDialogOpen(false);
      setFormData({ nombre: "", tipo: "", ubicacion: "", fechaInicio: "", presupuesto: "" });
      toast.success("Proyecto registrado con éxito");
    } catch {
      toast.error("Error al registrar el proyecto");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_URL}/proyectos/${id}`, { method: "DELETE" });
      setProyectos(prev => prev.filter(p => p.id !== id));
      toast.success("Proyecto eliminado correctamente");
    } catch {
      toast.error("Error al eliminar el proyecto");
    }
  };

  const getEstadoBadge = (estado: Proyecto["estado"]) => {
    const badges = {
      planificacion: <Badge variant="secondary">Planificación</Badge>,
      en_ejecucion: <Badge className="bg-green-600">En Ejecución</Badge>,
      pausada: <Badge variant="destructive">Pausada</Badge>,
      finalizada: <Badge variant="outline">Finalizada</Badge>,
    };
    return badges[estado];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gestión de Proyectos</h2>
          <p className="text-muted-foreground mt-2">
            Registrar, modificar y organizar proyectos de obra
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Obra</DialogTitle>
              <DialogDescription>
                Complete la información del proyecto. Los campos marcados son obligatorios.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Obra Vial Ruta 14"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Obra *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Infraestructura Vial">Infraestructura Vial</SelectItem>
                      <SelectItem value="Construcción Edilicia">Construcción Edilicia</SelectItem>
                      <SelectItem value="Obra Hidráulica">Obra Hidráulica</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación *</Label>
                  <Input
                    id="ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                    placeholder="Ciudad, Provincia"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha de Inicio *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="presupuesto">Presupuesto Estimado (ARS) *</Label>
                  <Input
                    id="presupuesto"
                    type="number"
                    value={formData.presupuesto}
                    onChange={(e) => setFormData({...formData, presupuesto: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Proyecto</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar proyectos por nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {loading && (
        <div className="text-center text-muted-foreground py-12">Cargando proyectos...</div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProyectos.map((proyecto) => (
          <Card key={proyecto.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{proyecto.nombre}</CardTitle>
                  <CardDescription className="mt-2">{proyecto.tipo}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(proyecto.id)}>
                    <Trash2 className="w-4 h-4 " style={{ color: "#ef4444" }} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {proyecto.ubicacion}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {proyecto.encargado}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Inicio: {new Date(proyecto.fechaInicio).toLocaleDateString('es-AR')}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avance físico</span>
                  <span className="font-semibold">{proyecto.avance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${proyecto.avance}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Presupuesto: </span>
                  <span className="font-semibold">
                    ${proyecto.presupuesto.toLocaleString('es-AR')}
                  </span>
                </div>
                {getEstadoBadge(proyecto.estado)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProyectos.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No se encontraron proyectos</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
