import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Package, Plus, TrendingDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Material {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  asignado: number;
  consumido: number;
}

export default function MaterialesPage() {
  const [materiales] = useState<Material[]>([
    { id: "1", nombre: "Cemento Portland", unidad: "bolsas", stock: 500, asignado: 300, consumido: 180 },
    { id: "2", nombre: "Arena Fina", unidad: "m³", stock: 150, asignado: 80, consumido: 55 },
    { id: "3", nombre: "Piedra Partida", unidad: "m³", stock: 200, asignado: 120, consumido: 95 },
    { id: "4", nombre: "Hierro 8mm", unidad: "kg", stock: 3000, asignado: 2000, consumido: 1850 },
    { id: "5", nombre: "Ladrillo Hueco", unidad: "unidades", stock: 10000, asignado: 6000, consumido: 4200 },
  ]);

  const [consumoData, setConsumoData] = useState({
    proyecto: "",
    material: "",
    cantidad: "",
    fecha: new Date().toISOString().split('T')[0]
  });

  const proyectos = [
    "Obra Vial Ruta 14",
    "Edificio Residencial Los Pinos",
    "Puente Posadas-Encarnación"
  ];

  const handleRegistrarConsumo = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Consumo de material registrado correctamente");
    setConsumoData({
      proyecto: "",
      material: "",
      cantidad: "",
      fecha: new Date().toISOString().split('T')[0]
    });
  };

  const getStockStatus = (stock: number, consumido: number) => {
    const disponible = stock - consumido;
    const porcentaje = (disponible / stock) * 100;
    
    if (porcentaje < 20) return { color: "text-red-600", bg: "bg-secondary", label: "Crítico" };
    if (porcentaje < 40) return { color: "text-orange-600", bg: "bg-secondary", label: "Bajo" };
    return { color: "text-green-600", bg: "bg-secondary", label: "Normal" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Gestión de Materiales</h2>
        <p className="text-muted-foreground mt-2">
          Asignar materiales y registrar consumo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipos de Material</p>
                <p className="text-3xl font-bold text-foreground mt-2">{materiales.length}</p>
              </div>
              <div className="bg-secondary p-3 rounded-lg">
                <Package className="w-6 h-6 " style={{ color: "#3b82f6" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Total</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {materiales.reduce((acc, m) => acc + m.stock, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-secondary p-3 rounded-lg">
                <TrendingDown className="w-6 h-6 " style={{ color: "#22c55e" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Activas</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {materiales.filter(m => ((m.stock - m.consumido) / m.stock) < 0.4).length}
                </p>
              </div>
              <div className="bg-secondary p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 " style={{ color: "#ef4444" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrar Consumo */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Consumo de Materiales</CardTitle>
            <CardDescription>
              Controlar los materiales efectivamente utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegistrarConsumo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proyecto-consumo">Proyecto</Label>
                <Select 
                  value={consumoData.proyecto} 
                  onValueChange={(value) => setConsumoData({...consumoData, proyecto: value})}
                  required
                >
                  <SelectTrigger id="proyecto-consumo">
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
                <Label htmlFor="material">Material</Label>
                <Select 
                  value={consumoData.material} 
                  onValueChange={(value) => setConsumoData({...consumoData, material: value})}
                  required
                >
                  <SelectTrigger id="material">
                    <SelectValue placeholder="Seleccionar material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materiales.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad-consumo">Cantidad Consumida</Label>
                <Input
                  id="cantidad-consumo"
                  type="number"
                  value={consumoData.cantidad}
                  onChange={(e) => setConsumoData({...consumoData, cantidad: e.target.value})}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha-consumo">Fecha</Label>
                <Input
                  id="fecha-consumo"
                  type="date"
                  value={consumoData.fecha}
                  onChange={(e) => setConsumoData({...consumoData, fecha: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Consumo
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Asignar Materiales */}
        <Card>
          <CardHeader>
            <CardTitle>Asignar Materiales a Obra</CardTitle>
            <CardDescription>
              Asociar materiales específicos a cada proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Permite controlar los recursos disponibles y utilizados en cada proyecto.
              </p>
              <Button className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Asignar Materiales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventario de Materiales */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario de Materiales</CardTitle>
          <CardDescription>
            Consultar materiales disponibles y utilizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {materiales.map((material) => {
              const disponible = material.stock - material.consumido;
              const porcentajeConsumido = ((material.consumido / material.asignado) * 100).toFixed(0);
              const status = getStockStatus(material.stock, material.consumido);
              
              return (
                <div key={material.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-foreground">{material.nombre}</h4>
                        <Badge className={`${status.bg} ${status.color} border-0`}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Unidad: {material.unidad}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock Total</p>
                      <p className="font-semibold text-foreground">{material.stock}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Asignado</p>
                      <p className="font-semibold text-foreground">{material.asignado}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Consumido</p>
                      <p className="font-semibold text-foreground">{material.consumido}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Disponible</p>
                      <p className="font-semibold text-foreground">{disponible}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uso del material asignado</span>
                      <span className="font-semibold">{porcentajeConsumido}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          parseInt(porcentajeConsumido) > 90 ? 'bg-red-600' :
                          parseInt(porcentajeConsumido) > 70 ? 'bg-orange-600' :
                          'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(parseInt(porcentajeConsumido), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
