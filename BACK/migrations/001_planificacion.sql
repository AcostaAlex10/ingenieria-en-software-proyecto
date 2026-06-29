-- Base de datos: sgso
-- Modulo: Planificacion
-- Tablas: usuario, proyecto, planificacion, avance_fisico
--
-- INSTRUCCIONES DBEAVER:
--   1. Crear la base de datos "sgso" manualmente (clic derecho en la conexion -> Create New Database)
--   2. Expandir la conexion, clic derecho en "sgso" -> SQL Editor -> Open SQL Script
--   3. Abrir este archivo y ejecutar con Ctrl+A luego Ctrl+Enter

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol        ENUM('PersonalAdministrativo','PersonalTecnico','Gerente','AdministradorSistema') NOT NULL,
  activo     TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS proyecto (
  id_proyecto          INT AUTO_INCREMENT PRIMARY KEY,
  nombre               VARCHAR(150) NOT NULL,
  ubicacion            VARCHAR(255) NOT NULL,
  tipo                 VARCHAR(100) NOT NULL,
  fecha_inicio         DATE NOT NULL,
  fecha_fin            DATE,
  presupuesto_estimado DECIMAL(15,2) NOT NULL,
  estado               ENUM('Creado','Planificado','EnEjecucion','Pausado','EnRevision','Finalizado','Cancelado') NOT NULL DEFAULT 'Creado',
  id_responsable       INT NOT NULL,
  CONSTRAINT fk_proyecto_usuario FOREIGN KEY (id_responsable) REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS planificacion (
  id_planificacion      INT AUTO_INCREMENT PRIMARY KEY,
  avance_esperado_total DECIMAL(5,2) NOT NULL,
  fecha_carga           DATE NOT NULL,
  id_proyecto           INT NOT NULL UNIQUE,
  CONSTRAINT fk_planificacion_proyecto FOREIGN KEY (id_proyecto) REFERENCES proyecto(id_proyecto) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS avance_fisico (
  id_avance          INT AUTO_INCREMENT PRIMARY KEY,
  cantidad_ejecutada DECIMAL(12,2) NOT NULL,
  porcentaje_avance  DECIMAL(5,2) NOT NULL,
  fecha              DATE NOT NULL,
  observaciones      TEXT,
  id_planificacion   INT NOT NULL,
  CONSTRAINT fk_avance_planificacion FOREIGN KEY (id_planificacion) REFERENCES planificacion(id_planificacion) ON DELETE CASCADE
);

INSERT IGNORE INTO usuario (id_usuario, nombre, email, contrasena, rol)
VALUES (1, 'Admin Sistema', 'admin@sgso.com', 'admin123', 'AdministradorSistema');
