-- Modulo: Etapas de planificacion (planificacion por cronograma con fechas y peso porcentual)
-- Ejecutar una sola vez sobre la base existente.

CREATE TABLE IF NOT EXISTS etapa_planificacion (
  id_etapa          INT AUTO_INCREMENT PRIMARY KEY,
  id_planificacion  INT NOT NULL,
  nombre            VARCHAR(150) NOT NULL,
  peso_porcentual   DECIMAL(5,2) NOT NULL,
  fecha_inicio      DATE NOT NULL,
  fecha_fin         DATE NOT NULL,
  orden             INT NOT NULL DEFAULT 0,
  presupuesto_base  DECIMAL(15,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_etapa_plan FOREIGN KEY (id_planificacion)
    REFERENCES planificacion(id_planificacion) ON DELETE CASCADE
);

-- avance_esperado_total pasa a ser opcional (fallback cuando no hay etapas)
ALTER TABLE planificacion MODIFY COLUMN avance_esperado_total DECIMAL(5,2) NOT NULL DEFAULT 0;
