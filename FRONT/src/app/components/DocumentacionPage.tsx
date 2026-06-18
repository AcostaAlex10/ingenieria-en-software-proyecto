import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { FileText, Upload, Download, Eye, Trash2, Image as ImageIcon, File } from "lucide-react";
import { toast } from "sonner";

interface Documento {
  id: string;
  nombre: string;
  tipo: "pdf" | "imagen" | "otro";
  proyecto: string;
  categoria: string;
  fechaSubida: string;
  tamano: string;
}

export default function DocumentacionPage() {
  const [documentos] = useState<Documento[]>([
    {
      id: "1",
      nombre: "Plano_General_Obra_Vial.pdf",
      tipo: "pdf",
      proyecto: "Obra Vial Ruta 14",
      categoria: "Planos",
      fechaSubida: "2026-05-20",
      tamano: "2.4 MB"
    },
    {
      id: "2",
      nombre: "Contrato_Principal.pdf",
      tipo: "pdf",
      proyecto: "Edificio Residencial Los Pinos",
      categoria: "Contratos",
      fechaSubida: "2026-05-18",
      tamano: "1.8 MB"
    },
    {
      id: "3",
      nombre: "Avance_Columnas_05-06.jpg",
      tipo: "imagen",
      proyecto: "Edificio Residencial Los Pinos",
      categoria: "Fotografías",
      fechaSubida: "2026-06-05",
      tamano: "3.2 MB"
    },
    {
      id: "4",
      nombre: "Presupuesto_Inicial.pdf",
      tipo: "pdf",
      proyecto: "Puente Posadas-Encarnación",
      categoria: "Presupuestos",
      fechaSubida: "2026-04-10",
      tamano: "890 KB"
    },
    {
      id: "5",
      nombre: "Certificado_Calidad_Hormigon.pdf",
      tipo: "pdf",
      proyecto: "Puente Posadas-Encarnación",
      categoria: "Certificaciones",
      fechaSubida: "2026-05-30",
      tamano: "650 KB"
    },
  ]);

  const [filtroProyecto, setFiltroProyecto] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");

  const proyectos = [
    "Obra Vial Ruta 14",
    "Edificio Residencial Los Pinos",
    "Puente Posadas-Encarnación"
  ];

  const categorias = [
    "Planos",
    "Contratos",
    "Presupuestos",
    "Certificaciones",
    "Fotografías",
    "Reportes"
  ];

  const documentosFiltrados = documentos.filter(doc => {
    const matchProyecto = filtroProyecto === "todos" || doc.proyecto === filtroProyecto;
    const matchCategoria = filtroCategoria === "todos" || doc.categoria === filtroCategoria;
    return matchProyecto && matchCategoria;
  });

  const handleUpload = () => {
    toast.success("Documento almacenado correctamente");
  };

  const handleDelete = (id: string) => {
    toast.success("Documento eliminado");
  };

  const getIconForType = (tipo: Documento["tipo"]) => {
    switch (tipo) {
      case "pdf":
        return <FileText className="w-5 h-5 " style={{ color: "#ef4444" }} />;
      case "imagen":
        return <ImageIcon className="w-5 h-5 " style={{ color: "#3b82f6" }} />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Documentación</h2>
        <p className="text-muted-foreground mt-2">
          Almacenar y consultar documentos de obra
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Almacenar Documentación</CardTitle>
          <CardDescription>
            Guardar contratos, reportes, planos y fotografías de las obras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proyecto-doc">Proyecto</Label>
                <Select>
                  <SelectTrigger id="proyecto-doc">
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
                <Label htmlFor="categoria-doc">Categoría</Label>
                <Select>
                  <SelectTrigger id="categoria-doc">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="archivo">Archivo</Label>
                <Input id="archivo" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: PDF, JPG, PNG (Máx. 10MB)
                </p>
              </div>
              <Button onClick={handleUpload} className="w-full gap-2">
                <Upload className="w-4 h-4" />
                Subir Documento
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">Arrastra archivos aquí</p>
                <p className="text-xs mt-1">o usa el botón de carga</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro-proyecto">Filtrar por Proyecto</Label>
              <Select value={filtroProyecto} onValueChange={setFiltroProyecto}>
                <SelectTrigger id="filtro-proyecto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los proyectos</SelectItem>
                  {proyectos.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro-categoria">Filtrar por Categoría</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger id="filtro-categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Consultar Documentación</CardTitle>
          <CardDescription>
            Acceder a archivos y documentación almacenada ({documentosFiltrados.length} documentos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documentosFiltrados.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {getIconForType(doc.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{doc.nombre}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{doc.proyecto}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">{doc.categoria}</Badge>
                      <span>•</span>
                      <span>{doc.tamano}</span>
                      <span>•</span>
                      <span>{new Date(doc.fechaSubida).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="w-4 h-4 " style={{ color: "#ef4444" }} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {documentosFiltrados.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No se encontraron documentos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
