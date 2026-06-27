import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, MapPin, User, Calendar, TrendingUp, Plus, Users, CloudRain, Trash2, Package, FileText, ExternalLink, AlertTriangle, Pause, Layers, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  obtenerProyecto, obtenerPlanificacion, crearPlanificacion,
  listarAvances, resumenAvances, crearAvance,
  listarAsistencias, crearAsistencia, eliminarAsistencia,
  listarIncidencias, crearIncidencia, eliminarIncidencia,
  listarCatalogoMateriales, listarMaterialesObra, asignarMaterial,
  eliminarAsignacionMaterial, crearConsumo,
  listarDocumentos, crearDocumento, eliminarDocumento,
  listarInactividades, crearInactividad, eliminarInactividad,
  listarExcedentes, crearExcedente, eliminarExcedente,
  type Proyecto, type Planificacion, type Avance, type Resumen,
  type Asistencia, type Incidencia, type EstadoAsistencia,
  type TipoIncidencia, type GravedadIncidencia,
  type Material, type AsignacionMaterial, type Documento, type TipoDocumento,
  type PeriodoInactividad, type ItemExcedente,
} from "../api/proyectos";
import { puedeGestionarObras, puedeRegistrarAvance, puedeCargarDocumentos, puedeVerCostos } from "../auth/permisos";

// Fecha de HOY en zona horaria LOCAL (no UTC), para que de noche en Argentina
// no muestre el día siguiente.
const hoy = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

// Etiquetas y colores para mostrar asistencia e incidencias.
const ESTADO_ASIS: Record<EstadoAsistencia, { label: string; color: string }> = {
  presente: { label: "Presente", color: "#22c55e" },
  ausente: { label: "Ausente", color: "#ef4444" },
  tarde: { label: "Tarde", color: "#e8981e" },
};
const TIPO_INC: Record<TipoIncidencia, string> = {
  clima: "Clima",
  falla_maquinaria: "Falla de maquinaria",
  proveedor: "Retraso de proveedor",
  otro: "Otro",
};
const GRAVEDAD_INC: Record<GravedadIncidencia, { label: string; color: string }> = {
  baja: { label: "Baja", color: "#22c55e" },
  media: { label: "Media", color: "#e8981e" },
  alta: { label: "Alta", color: "#ef4444" },
};

export default function ProyectoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Permisos (RF19): quién puede planificar, registrar avances y cargar docs.
  const gestiona = puedeGestionarObras();
  const registraAvance = puedeRegistrarAvance();
  const cargaDocs = puedeCargarDocumentos();
  const verCostos = puedeVerCostos();

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [plan, setPlan] = useState<Planificacion | null>(null);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);

  const [formPlan, setFormPlan] = useState({ avance_esperado_total: "", fecha_carga: hoy() });
  const [formAvance, setFormAvance] = useState({ cantidad_ejecutada: "", porcentaje_avance: "", fecha: hoy(), observaciones: "" });

  // Seguimiento operativo (Sprint 2): asistencia (RF06) e incidencias (RF09).
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [formAsis, setFormAsis] = useState<{ trabajador: string; estado: EstadoAsistencia; fecha: string; justificacion: string }>(
    { trabajador: "", estado: "presente", fecha: hoy(), justificacion: "" }
  );
  const [formInc, setFormInc] = useState<{ tipo: TipoIncidencia; gravedad: GravedadIncidencia; fecha: string; descripcion: string; dias_retraso: string }>(
    { tipo: "clima", gravedad: "media", fecha: hoy(), descripcion: "", dias_retraso: "" }
  );

  // Materiales (RF10/RF12) y documentación (RF16).
  const [catalogo, setCatalogo] = useState<Material[]>([]);
  const [materiales, setMateriales] = useState<AsignacionMaterial[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [formMat, setFormMat] = useState({ id_material: "", cantidad_asignada: "" });
  const [consumoInput, setConsumoInput] = useState<Record<number, string>>({});
  const [formDoc, setFormDoc] = useState<{ nombre: string; tipo: TipoDocumento; categoria: string; url: string }>(
    { nombre: "", tipo: "pdf", categoria: "", url: "" }
  );

  // Inactividad (RF25) y ítems excedentes (RF22).
  const [inactividades, setInactividades] = useState<PeriodoInactividad[]>([]);
  const [excedentes, setExcedentes] = useState<ItemExcedente[]>([]);
  const [formInac, setFormInac] = useState({ fecha_inicio: hoy(), fecha_fin: "", motivo: "" });
  const [formExc, setFormExc] = useState({ descripcion: "", cantidad: "", unidad: "", motivo: "" });

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Todo lo de la obra se pide EN PARALELO (antes era en serie y con el
      // arranque en frío de Render tardaba >10 s mostrando "Cargando obra...").
      const [proy, asis, inci, mats, docs, inacs, excs, planif] = await Promise.all([
        obtenerProyecto(id),
        listarAsistencias(id),
        listarIncidencias(id),
        listarMaterialesObra(id),
        listarDocumentos(id),
        listarInactividades(id),
        listarExcedentes(id),
        obtenerPlanificacion(id),
      ]);
      setProyecto(proy);
      setAsistencias(asis);
      setIncidencias(inci);
      setMateriales(mats);
      setDocumentos(docs);
      setInactividades(inacs);
      setExcedentes(excs);
      setPlan(planif);
      // El catálogo de materiales no bloquea la carga de la obra.
      if (catalogo.length === 0) listarCatalogoMateriales().then(setCatalogo).catch(() => {});
      if (planif) {
        const [av, res] = await Promise.all([
          listarAvances(planif.id_planificacion),
          resumenAvances(planif.id_planificacion),
        ]);
        setAvances(av);
        setResumen(res);
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

  // --- Asistencia (RF06) ---
  async function guardarAsistencia(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await crearAsistencia(id, {
        fecha: formAsis.fecha,
        trabajador: formAsis.trabajador,
        estado: formAsis.estado,
        justificacion: formAsis.justificacion || undefined,
      });
      toast.success("Asistencia registrada");
      setFormAsis({ trabajador: "", estado: "presente", fecha: hoy(), justificacion: "" });
      setAsistencias(await listarAsistencias(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar la asistencia");
    }
  }
  async function borrarAsistencia(idA: number) {
    try {
      await eliminarAsistencia(idA);
      setAsistencias((prev) => prev.filter((a) => a.id_asistencia !== idA));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  // --- Incidencias externas (RF09) ---
  async function guardarIncidencia(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await crearIncidencia(id, {
        fecha: formInc.fecha,
        tipo: formInc.tipo,
        gravedad: formInc.gravedad,
        descripcion: formInc.descripcion,
        dias_retraso: formInc.dias_retraso ? parseInt(formInc.dias_retraso, 10) : 0,
      });
      toast.success("Incidencia registrada");
      setFormInc({ tipo: "clima", gravedad: "media", fecha: hoy(), descripcion: "", dias_retraso: "" });
      setIncidencias(await listarIncidencias(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar la incidencia");
    }
  }
  async function borrarIncidencia(idI: number) {
    try {
      await eliminarIncidencia(idI);
      setIncidencias((prev) => prev.filter((x) => x.id_incidencia !== idI));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  // --- Materiales (RF10/RF12) ---
  async function asignarMat(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await asignarMaterial(id, {
        id_material: parseInt(formMat.id_material, 10),
        cantidad_asignada: parseFloat(formMat.cantidad_asignada),
      });
      toast.success("Material asignado a la obra");
      setFormMat({ id_material: "", cantidad_asignada: "" });
      setMateriales(await listarMaterialesObra(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al asignar el material");
    }
  }
  async function borrarAsignacion(idAsig: number) {
    if (!id) return;
    try {
      await eliminarAsignacionMaterial(idAsig);
      setMateriales(await listarMaterialesObra(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }
  async function registrarConsumo(idAsig: number) {
    if (!id) return;
    const cantidad = parseFloat(consumoInput[idAsig] ?? "");
    if (!cantidad || cantidad <= 0) {
      toast.error("Ingresá una cantidad válida");
      return;
    }
    try {
      await crearConsumo(idAsig, { fecha: hoy(), cantidad_consumida: cantidad });
      toast.success("Consumo registrado");
      setConsumoInput((prev) => ({ ...prev, [idAsig]: "" }));
      setMateriales(await listarMaterialesObra(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar el consumo");
    }
  }

  // --- Documentación (RF16) ---
  async function guardarDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await crearDocumento(id, {
        nombre: formDoc.nombre,
        tipo: formDoc.tipo,
        categoria: formDoc.categoria || "General",
        url: formDoc.url,
        fecha_carga: hoy(),
      });
      toast.success("Documento agregado");
      setFormDoc({ nombre: "", tipo: "pdf", categoria: "", url: "" });
      setDocumentos(await listarDocumentos(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al agregar el documento");
    }
  }
  async function borrarDoc(idDoc: number) {
    try {
      await eliminarDocumento(idDoc);
      setDocumentos((prev) => prev.filter((d) => d.id_documento !== idDoc));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  // --- Inactividad (RF25) ---
  async function guardarInactividad(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await crearInactividad(id, {
        fecha_inicio: formInac.fecha_inicio,
        fecha_fin: formInac.fecha_fin || undefined,
        motivo: formInac.motivo,
      });
      toast.success("Período de inactividad registrado");
      setFormInac({ fecha_inicio: hoy(), fecha_fin: "", motivo: "" });
      setInactividades(await listarInactividades(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar el período");
    }
  }
  async function borrarInactividad(idP: number) {
    try {
      await eliminarInactividad(idP);
      setInactividades((prev) => prev.filter((p) => p.id_periodo !== idP));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  // --- Ítems excedentes (RF22) ---
  async function guardarExcedente(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await crearExcedente(id, {
        descripcion: formExc.descripcion,
        cantidad: formExc.cantidad ? parseFloat(formExc.cantidad) : undefined,
        unidad: formExc.unidad || undefined,
        fecha: hoy(),
        motivo: formExc.motivo || undefined,
      });
      toast.success("Ítem excedente registrado");
      setFormExc({ descripcion: "", cantidad: "", unidad: "", motivo: "" });
      setExcedentes(await listarExcedentes(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar el ítem");
    }
  }
  async function borrarExcedente(idX: number) {
    try {
      await eliminarExcedente(idX);
      setExcedentes((prev) => prev.filter((x) => x.id_item !== idX));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
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
          {/* RF15: certificación por monto = presupuesto x % de avance (oculto al técnico, RF20) */}
          {verCostos && proyecto.presupuesto != null && (
            <div className="flex items-center gap-2 md:col-span-3 pt-1" style={{ color: "var(--foreground)" }}>
              <Wallet className="w-4 h-4" /> Certificación a la fecha: <b>${Math.round((proyecto.presupuesto * proyecto.avance) / 100).toLocaleString("es-AR")}</b>
              <span className="text-muted-foreground">({proyecto.avance}% de ${proyecto.presupuesto.toLocaleString("es-AR")})</span>
            </div>
          )}
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

      {/* Asistencia del personal (RF06) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Asistencia del personal</CardTitle>
          <CardDescription>Registro diario de los trabajadores presentes en la obra.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {registraAvance && (
            <form onSubmit={guardarAsistencia} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="trab">Trabajador</Label>
                <Input id="trab" required value={formAsis.trabajador}
                  onChange={(e) => setFormAsis({ ...formAsis, trabajador: e.target.value })} placeholder="Nombre y apellido" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formAsis.estado} onValueChange={(v) => setFormAsis({ ...formAsis, estado: v as EstadoAsistencia })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presente">Presente</SelectItem>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fasis">Fecha</Label>
                <Input id="fasis" type="date" required value={formAsis.fecha}
                  onChange={(e) => setFormAsis({ ...formAsis, fecha: e.target.value })} />
              </div>
              <Button type="submit" className="gap-2"><Plus className="w-4 h-4" /> Registrar</Button>
              {formAsis.estado !== "presente" && (
                <div className="space-y-2 md:col-span-5">
                  <Label htmlFor="just">Justificación (opcional)</Label>
                  <Input id="just" value={formAsis.justificacion}
                    onChange={(e) => setFormAsis({ ...formAsis, justificacion: e.target.value })}
                    placeholder="Motivo de la ausencia o llegada tarde" />
                </div>
              )}
            </form>
          )}
          {asistencias.length === 0 ? (
            <p className="text-muted-foreground text-sm">Todavía no hay asistencias registradas.</p>
          ) : (
            <div className="space-y-2">
              {asistencias.map((a) => {
                const info = ESTADO_ASIS[a.estado];
                return (
                  <div key={a.id_asistencia} className="flex items-center gap-3 border rounded-md px-4 py-2 text-sm">
                    <span className="text-muted-foreground w-24">{new Date(a.fecha).toLocaleDateString("es-AR")}</span>
                    <span className="font-medium">{a.trabajador}</span>
                    <Badge style={{ background: info.color }}>{info.label}</Badge>
                    <span className="text-muted-foreground flex-1 truncate">{a.justificacion ?? ""}</span>
                    {registraAvance && (
                      <Button size="sm" variant="ghost" onClick={() => borrarAsistencia(a.id_asistencia)} title="Eliminar">
                        <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incidencias externas (RF09) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CloudRain className="w-5 h-5" /> Incidencias externas</CardTitle>
          <CardDescription>Clima, fallas de maquinaria o retrasos de proveedores que afectan la obra.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {registraAvance && (
            <form onSubmit={guardarIncidencia} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formInc.tipo} onValueChange={(v) => setFormInc({ ...formInc, tipo: v as TipoIncidencia })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clima">Clima</SelectItem>
                    <SelectItem value="falla_maquinaria">Falla de maquinaria</SelectItem>
                    <SelectItem value="proveedor">Retraso de proveedor</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gravedad</Label>
                <Select value={formInc.gravedad} onValueChange={(v) => setFormInc({ ...formInc, gravedad: v as GravedadIncidencia })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="finc">Fecha</Label>
                <Input id="finc" type="date" required value={formInc.fecha}
                  onChange={(e) => setFormInc({ ...formInc, fecha: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dr">Días de retraso</Label>
                <Input id="dr" type="number" min="0" value={formInc.dias_retraso}
                  onChange={(e) => setFormInc({ ...formInc, dias_retraso: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea id="desc" required value={formInc.descripcion}
                  onChange={(e) => setFormInc({ ...formInc, descripcion: e.target.value })}
                  placeholder="Detalle de la incidencia" />
              </div>
              <Button type="submit" className="gap-2 md:self-end"><Plus className="w-4 h-4" /> Registrar</Button>
            </form>
          )}
          {incidencias.length === 0 ? (
            <p className="text-muted-foreground text-sm">Todavía no hay incidencias registradas.</p>
          ) : (
            <div className="space-y-2">
              {incidencias.map((x) => {
                const g = GRAVEDAD_INC[x.gravedad];
                return (
                  <div key={x.id_incidencia} className="flex items-center gap-3 border rounded-md px-4 py-2 text-sm">
                    <span className="text-muted-foreground w-24">{new Date(x.fecha).toLocaleDateString("es-AR")}</span>
                    <span className="font-medium">{TIPO_INC[x.tipo]}</span>
                    <Badge style={{ background: g.color }}>{g.label}</Badge>
                    <span className="text-muted-foreground flex-1 truncate">{x.descripcion}</span>
                    {x.dias_retraso > 0 && <span className="text-xs text-muted-foreground whitespace-nowrap">+{x.dias_retraso} d</span>}
                    {registraAvance && (
                      <Button size="sm" variant="ghost" onClick={() => borrarIncidencia(x.id_incidencia)} title="Eliminar">
                        <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materiales (RF10/RF12) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Materiales</CardTitle>
          <CardDescription>Materiales asignados a la obra y consumo registrado. Se avisa si se excede lo asignado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gestiona && (
            <form onSubmit={asignarMat} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={formMat.id_material} onValueChange={(v) => setFormMat({ ...formMat, id_material: v })}>
                  <SelectTrigger><SelectValue placeholder="Elegí un material" /></SelectTrigger>
                  <SelectContent>
                    {catalogo.map((m) => (
                      <SelectItem key={m.id_material} value={String(m.id_material)}>{m.nombre} ({m.unidad})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cant">Cantidad asignada</Label>
                <Input id="cant" type="number" min="0" step="0.01" required value={formMat.cantidad_asignada}
                  onChange={(e) => setFormMat({ ...formMat, cantidad_asignada: e.target.value })} />
              </div>
              <Button type="submit" className="gap-2"><Plus className="w-4 h-4" /> Asignar material</Button>
            </form>
          )}
          {materiales.length === 0 ? (
            <p className="text-muted-foreground text-sm">Todavía no hay materiales asignados a la obra.</p>
          ) : (
            <div className="space-y-2">
              {materiales.map((m) => (
                <div key={m.id_asignacion} className="border rounded-md px-4 py-3 text-sm space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium">{m.nombre}</span>
                    <span className="text-muted-foreground">
                      {m.consumido} / {m.cantidad_asignada} {m.unidad} · restante {m.restante} {m.unidad}
                    </span>
                    {m.excedido && (
                      <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Excedido</Badge>
                    )}
                    {gestiona && (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => borrarAsignacion(m.id_asignacion)} title="Quitar material">
                        <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                      </Button>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, m.cantidad_asignada > 0 ? (m.consumido / m.cantidad_asignada) * 100 : 0)}%`, background: m.excedido ? "#ef4444" : "#3b82f6" }} />
                  </div>
                  {registraAvance && (
                    <div className="flex items-end gap-2 pt-1">
                      <Input type="number" min="0" step="0.01" placeholder={`Consumo (${m.unidad})`}
                        value={consumoInput[m.id_asignacion] ?? ""}
                        onChange={(e) => setConsumoInput((prev) => ({ ...prev, [m.id_asignacion]: e.target.value }))}
                        className="max-w-[220px]" />
                      <Button size="sm" type="button" onClick={() => registrarConsumo(m.id_asignacion)} className="gap-1">
                        <Plus className="w-4 h-4" /> Registrar consumo
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentación (RF16) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Documentación</CardTitle>
          <CardDescription>Documentos de la obra (planos, contratos, fotos). Se guarda un enlace al archivo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cargaDocs && (
            <form onSubmit={guardarDoc} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dnom">Nombre</Label>
                <Input id="dnom" required value={formDoc.nombre}
                  onChange={(e) => setFormDoc({ ...formDoc, nombre: e.target.value })} placeholder="Ej: Plano de planta" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formDoc.tipo} onValueChange={(v) => setFormDoc({ ...formDoc, tipo: v as TipoDocumento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="imagen">Imagen</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dcat">Categoría</Label>
                <Input id="dcat" value={formDoc.categoria}
                  onChange={(e) => setFormDoc({ ...formDoc, categoria: e.target.value })} placeholder="Plano / Contrato / Foto" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="durl">Enlace (URL)</Label>
                <Input id="durl" type="url" required value={formDoc.url}
                  onChange={(e) => setFormDoc({ ...formDoc, url: e.target.value })} placeholder="https://drive.google.com/..." />
              </div>
              <Button type="submit" className="gap-2 md:self-end"><Plus className="w-4 h-4" /> Agregar</Button>
            </form>
          )}
          {documentos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Todavía no hay documentos cargados.</p>
          ) : (
            <div className="space-y-2">
              {documentos.map((d) => (
                <div key={d.id_documento} className="flex items-center gap-3 border rounded-md px-4 py-2 text-sm">
                  <span className="text-muted-foreground w-24">{new Date(d.fecha_carga).toLocaleDateString("es-AR")}</span>
                  <span className="font-medium">{d.nombre}</span>
                  <Badge variant="secondary">{d.categoria}</Badge>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 ml-auto">
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                  {cargaDocs && (
                    <Button size="sm" variant="ghost" onClick={() => borrarDoc(d.id_documento)} title="Eliminar">
                      <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Períodos de inactividad (RF25) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Pause className="w-5 h-5" /> Períodos de inactividad</CardTitle>
          <CardDescription>Paradas de obra con su motivo (ayudan a justificar retrasos).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cargaDocs && (
            <form onSubmit={guardarInactividad} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label htmlFor="ii">Desde</Label>
                <Input id="ii" type="date" required value={formInac.fecha_inicio} onChange={(e) => setFormInac({ ...formInac, fecha_inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="if">Hasta (opcional)</Label>
                <Input id="if" type="date" value={formInac.fecha_fin} onChange={(e) => setFormInac({ ...formInac, fecha_fin: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="im">Motivo</Label>
                <Input id="im" required value={formInac.motivo} onChange={(e) => setFormInac({ ...formInac, motivo: e.target.value })} placeholder="Ej: Lluvias / falta de materiales" />
              </div>
              <Button type="submit" className="gap-2"><Plus className="w-4 h-4" /> Registrar período</Button>
            </form>
          )}
          {inactividades.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay períodos de inactividad registrados.</p>
          ) : (
            <div className="space-y-2">
              {inactividades.map((p) => (
                <div key={p.id_periodo} className="flex items-center gap-3 border rounded-md px-4 py-2 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(p.fecha_inicio).toLocaleDateString("es-AR")}{p.fecha_fin ? ` → ${new Date(p.fecha_fin).toLocaleDateString("es-AR")}` : ""}
                  </span>
                  <span className="flex-1">{p.motivo}</span>
                  {cargaDocs && (
                    <Button size="sm" variant="ghost" onClick={() => borrarInactividad(p.id_periodo)} title="Eliminar"><Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} /></Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ítems excedentes (RF22) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Ítems / trabajos excedentes</CardTitle>
          <CardDescription>Trabajos no contemplados en la planificación inicial.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cargaDocs && (
            <form onSubmit={guardarExcedente} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="xd">Descripción</Label>
                <Input id="xd" required value={formExc.descripcion} onChange={(e) => setFormExc({ ...formExc, descripcion: e.target.value })} placeholder="Ej: Refuerzo de cimientos" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xc">Cantidad</Label>
                <Input id="xc" type="number" min="0" step="0.01" value={formExc.cantidad} onChange={(e) => setFormExc({ ...formExc, cantidad: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xu">Unidad</Label>
                <Input id="xu" value={formExc.unidad} onChange={(e) => setFormExc({ ...formExc, unidad: e.target.value })} placeholder="m3, kg..." />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="xm">Motivo (opcional)</Label>
                <Input id="xm" value={formExc.motivo} onChange={(e) => setFormExc({ ...formExc, motivo: e.target.value })} placeholder="Por qué surgió" />
              </div>
              <Button type="submit" className="gap-2 md:self-end"><Plus className="w-4 h-4" /> Registrar</Button>
            </form>
          )}
          {excedentes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay ítems excedentes registrados.</p>
          ) : (
            <div className="space-y-2">
              {excedentes.map((x) => (
                <div key={x.id_item} className="flex items-center gap-3 border rounded-md px-4 py-2 text-sm">
                  <span className="text-muted-foreground w-24">{new Date(x.fecha).toLocaleDateString("es-AR")}</span>
                  <span className="font-medium">{x.descripcion}</span>
                  {x.cantidad != null && <span className="text-muted-foreground">{x.cantidad} {x.unidad ?? ""}</span>}
                  <span className="text-muted-foreground flex-1 truncate">{x.motivo ?? ""}</span>
                  {cargaDocs && (
                    <Button size="sm" variant="ghost" onClick={() => borrarExcedente(x.id_item)} title="Eliminar"><Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} /></Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
