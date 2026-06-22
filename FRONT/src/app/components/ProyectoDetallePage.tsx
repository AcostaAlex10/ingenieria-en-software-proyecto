import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { ArrowLeft, MapPin, User, Calendar, TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  obtenerProyecto, obtenerPlanificacion, crearPlanificacion,
  listarAvances, resumenAvances, crearAvance,
  type Proyecto, type Planificacion, type Avance, type Resumen,
} from "../api/proyectos";
import { puedeGestionarObras, puedeRegistrarAvance } from "../auth/permisos";

const hoy = () => new Date().toISOString().slice(0, 10);

export default function ProyectoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Permisos (RF19): quién puede planificar y quién puede registrar avances.
  const gestiona = puedeGestionarObras();
  const registraAvance = puedeRegistrarAvance();

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [plan, setPlan] = useState<Planificacion | null>(null);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);

  const [formPlan, setFormPlan] = useState({ avance_esperado_total: "", fecha_carga: hoy() });
  const [formAvance, setFormAvance] = useState({ cantidad_ejecutada: "", porcentaje_avance: "", fecha: hoy(), observaciones: "" });

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const proy = await obtenerProyecto(id);
      setProyecto(proy);
      const planif = await obtenerPlanificacion(id);
      setPlan(planif);
      if (planif) {
        setAvances(await listarAvances(planif.id_planificacion));
        setResumen(await resumenAvances(planif.id_planificacion));
      } else {
        setAvances([]);
        setResumen(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar la obra");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function guardarPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await crearPlanificacion(id, {
        avance_esperado_total: parseFloat(formPlan.avance_esperado_total),
        fecha_carga: formPlan.fecha_carga,
      });
      toast.success("Planificación creada");
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la planificación");
    }
  }

  async function guardarAvance(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    try {
      await crearAvance(plan.id_planificacion, {
        cantidad_ejecutada: parseFloat(formAvance.cantidad_ejecutada),
        porcentaje_avance: parseFloat(formAvance.porcentaje_avance),
        fecha: formAvance.fecha,
        observaciones: formAvance.observaciones || undefined,
      });
      toast.success("Avance registrado");
      setFormAvance({ cantidad_ejecutada: "", porcentaje_avance: "", fecha: hoy(), observaciones: "" });
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar el avance");
    }
  }

  if (loading) return <div className="text-center text-muted-foreground py-12">Cargando obra...</div>;
  if (!proyecto) return (
    <div className="space-y-4">
      <Button variant="outline" className="gap-2" onClick={() => navigate("/proyectos")}><ArrowLeft className="w-4 h-4" /> Volver</Button>
      <p className="text-muted-foreground">Proyecto no encontrado.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Button variant="outline" className="gap-2" onClick={() => navigate("/proyectos")}>
        <ArrowLeft className="w-4 h-4" /> Volver a proyectos
      </Button>

      {/* Datos de la obra */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{proyecto.nombre}</CardTitle>
              <CardDescription className="mt-1">{proyecto.tipo}</CardDescription>
            </div>
            <Badge variant="secondary">{proyecto.estado}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {proyecto.ubicacion}</div>
          <div className="flex items-center gap-2"><User className="w-4 h-4" /> {proyecto.encargado}</div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Inicio: {new Date(proyecto.fechaInicio).toLocaleDateString("es-AR")}</div>
        </CardContent>
      </Card>

      {/* Planificacion (RF02) */}
      {!plan ? (
        <Card>
          <CardHeader>
            <CardTitle>Planificación de la obra</CardTitle>
            <CardDescription>
              {gestiona
                ? "Esta obra todavía no tiene planificación. Cargá el avance esperado total."
                : "Esta obra todavía no tiene planificación cargada."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!gestiona ? (
              <p className="text-muted-foreground text-sm">Solo el personal administrativo puede cargar la planificación.</p>
            ) : (
            <form onSubmit={guardarPlan} className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="aet">Avance esperado total (%)</Label>
                <Input id="aet" type="number" min="0" max="100" step="0.01" required
                  value={formPlan.avance_esperado_total}
                  onChange={(e) => setFormPlan({ ...formPlan, avance_esperado_total: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fc">Fecha de carga</Label>
                <Input id="fc" type="date" required value={formPlan.fecha_carga}
                  onChange={(e) => setFormPlan({ ...formPlan, fecha_carga: e.target.value })} />
              </div>
              <Button type="submit" className="gap-2"><Plus className="w-4 h-4" /> Crear planificación</Button>
            </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen avance esperado vs real */}
          {resumen && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Seguimiento de avance</CardTitle>
                <CardDescription>Comparación entre lo planificado y lo ejecutado.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Metric label="Avance esperado" value={`${resumen.avance_esperado}%`} />
                <Metric label="Avance real" value={`${resumen.avance_real}%`} />
                <Metric label="Desvío" value={`${resumen.desvio_pp} pp`} color={resumen.desvio_pp < 0 ? "#ef4444" : "#22c55e"} />
                <Metric label="Registros" value={String(resumen.total_registros)} />
              </CardContent>
            </Card>
          )}

          {/* Cargar avance (solo el encargado de obra / Personal Técnico) */}
          {registraAvance && (
          <Card>
            <CardHeader><CardTitle>Registrar avance físico</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={guardarAvance} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="ce">Cantidad ejecutada</Label>
                  <Input id="ce" type="number" min="0" step="0.01" required value={formAvance.cantidad_ejecutada}
                    onChange={(e) => setFormAvance({ ...formAvance, cantidad_ejecutada: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pa">% de avance</Label>
                  <Input id="pa" type="number" min="0" max="100" step="0.01" required value={formAvance.porcentaje_avance}
                    onChange={(e) => setFormAvance({ ...formAvance, porcentaje_avance: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fa">Fecha</Label>
                  <Input id="fa" type="date" required value={formAvance.fecha}
                    onChange={(e) => setFormAvance({ ...formAvance, fecha: e.target.value })} />
                </div>
                <Button type="submit" className="gap-2"><Plus className="w-4 h-4" /> Registrar</Button>
                <div className="space-y-2 md:col-span-4">
                  <Label htmlFor="obs">Observaciones</Label>
                  <Textarea id="obs" value={formAvance.observaciones}
                    onChange={(e) => setFormAvance({ ...formAvance, observaciones: e.target.value })}
                    placeholder="Opcional" />
                </div>
              </form>
            </CardContent>
          </Card>
          )}

          {/* Historial de avances */}
          <Card>
            <CardHeader><CardTitle>Historial de avances ({avances.length})</CardTitle></CardHeader>
            <CardContent>
              {avances.length === 0 ? (
                <p className="text-muted-foreground text-sm">Todavía no hay avances cargados.</p>
              ) : (
                <div className="space-y-2">
                  {avances.map((a) => (
                    <div key={a.id_avance} className="flex items-center justify-between border rounded-md px-4 py-2 text-sm">
                      <span className="text-muted-foreground">{new Date(a.fecha).toLocaleDateString("es-AR")}</span>
                      <span>Cant.: <b>{a.cantidad_ejecutada}</b></span>
                      <span>Avance: <b>{a.porcentaje_avance}%</b></span>
                      <span className="text-muted-foreground flex-1 text-right truncate ml-4">{a.observaciones ?? ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
