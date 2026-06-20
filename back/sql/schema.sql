-- Base de datos: sgso  (MariaDB / MySQL)
-- Esquema del backend PHP: autenticacion (usuario) + proyectos (RF01).
--
-- Crear la base antes de ejecutar:
--   CREATE DATABASE sgso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Luego ejecutar este script sobre la base "sgso" (DBeaver o linea de comandos).

-- Tabla de usuarios para el login. La columna `contrasena` guarda el
-- HASH bcrypt, nunca texto plano. El `rol` deja preparada RF19.
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  contrasena     VARCHAR(255) NOT NULL,
  rol            ENUM('PersonalAdministrativo','PersonalTecnico','Gerente','AdministradorSistema') NOT NULL,
  activo         TINYINT(1) NOT NULL DEFAULT 1,
  -- Identificador de la sesion activa: cada login lo regenera, invalidando la
  -- sesion anterior (un usuario no puede estar logueado en dos lados a la vez).
  sesion_token   VARCHAR(64) NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proyectos de obra (RF01: registrar, modificar, eliminar, listar).
-- Los campos coinciden con el contrato que consume el frontend.
CREATE TABLE IF NOT EXISTS proyecto (
  id_proyecto  INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  tipo         VARCHAR(100) NOT NULL,
  ubicacion    VARCHAR(255) NOT NULL,
  encargado    VARCHAR(150) NOT NULL,
  fecha_inicio DATE NOT NULL,
  estado       VARCHAR(30) NOT NULL DEFAULT 'planificacion',
  avance       DECIMAL(5,2) NOT NULL DEFAULT 0,
  presupuesto  DECIMAL(15,2) NOT NULL
);

-- Planificacion de cada obra (una por proyecto): avance esperado total.
-- id_proyecto es UNIQUE -> relacion 1 a 1 con proyecto.
CREATE TABLE IF NOT EXISTS planificacion (
  id_planificacion      INT AUTO_INCREMENT PRIMARY KEY,
  avance_esperado_total DECIMAL(5,2) NOT NULL,
  fecha_carga           DATE NOT NULL,
  id_proyecto           INT NOT NULL UNIQUE,
  CONSTRAINT fk_planificacion_proyecto FOREIGN KEY (id_proyecto)
    REFERENCES proyecto(id_proyecto) ON DELETE CASCADE
);

-- Avances fisicos diarios cargados contra una planificacion.
CREATE TABLE IF NOT EXISTS avance_fisico (
  id_avance          INT AUTO_INCREMENT PRIMARY KEY,
  cantidad_ejecutada DECIMAL(12,2) NOT NULL,
  porcentaje_avance  DECIMAL(5,2) NOT NULL,
  fecha              DATE NOT NULL,
  observaciones      TEXT,
  id_planificacion   INT NOT NULL,
  CONSTRAINT fk_avance_planificacion FOREIGN KEY (id_planificacion)
    REFERENCES planificacion(id_planificacion) ON DELETE CASCADE
);
