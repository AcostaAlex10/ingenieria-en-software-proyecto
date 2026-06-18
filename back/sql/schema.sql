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
