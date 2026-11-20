/* =====================================================
   ESQUEMA COMPLETO Y CORREGIDO - Plataforma de servicios técnicos
   Motor: MySQL (InnoDB)
   ===================================================== */

-- 0. CREAR Y SELECCIONAR BASE DE DATOS (Opcional)
CREATE DATABASE IF NOT EXISTS `proyecto_1` /*!40100 COLLATE 'utf8mb4_general_ci' */;
USE `proyecto_1`;

-- Limpiar tablas si ya existen (en orden inverso por las FK)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Notificaciones;
DROP TABLE IF EXISTS Resenas;
DROP TABLE IF EXISTS MensajesChat;
DROP TABLE IF EXISTS SolicitudesServicio;
DROP TABLE IF EXISTS ItemsCatalogoTecnico;
DROP TABLE IF EXISTS Tecnicos;
DROP TABLE IF EXISTS Clientes;
DROP TABLE IF EXISTS Usuarios;
DROP TABLE IF EXISTS Especialidades;
DROP TABLE IF EXISTS Categorias;
DROP VIEW IF EXISTS vw_EstadisticasTecnico;
SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================
-- 1. CREACIÓN DE TABLAS (DDL)
-- =====================================================

-- ---------- CATÁLOGOS ----------
CREATE TABLE Categorias (
    Id          INT AUTO_INCREMENT PRIMARY KEY,
    Nombre      VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE Especialidades (
    Id          INT AUTO_INCREMENT PRIMARY KEY,
    CategoriaId INT NOT NULL,
    Nombre      VARCHAR(100) NOT NULL,
    CONSTRAINT UQ_Especialidad UNIQUE (CategoriaId, Nombre),
    CONSTRAINT FK_Especialidades_Categorias FOREIGN KEY (CategoriaId) REFERENCES Categorias(Id)
) ENGINE=InnoDB;

-- ---------- USUARIOS (datos comunes) ----------
CREATE TABLE Usuarios (
    Id                  INT AUTO_INCREMENT PRIMARY KEY,
    NombreCompleto      VARCHAR(150) NOT NULL,
    CorreoElectronico   VARCHAR(256) NOT NULL UNIQUE,
    ContrasenaHash      VARCHAR(512) NOT NULL,         -- nunca texto plano
    Rol                 VARCHAR(20)  NOT NULL
                        CHECK (Rol IN ('Cliente','Tecnico','Admin')),
    Telefono            VARCHAR(30)  NULL,
    Direccion           VARCHAR(250) NULL,
    Ciudad              VARCHAR(100) NULL,
    UrlFotoPerfil       VARCHAR(500) NULL,
    EstaActivo          TINYINT(1) NOT NULL DEFAULT 1,
    FechaCreacion       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_Usuarios_Id_Rol UNIQUE (Id, Rol)    -- permite la FK compuesta de los perfiles
) ENGINE=InnoDB;

-- ---------- PERFIL CLIENTE (1 a 1 con Usuarios) ----------
CREATE TABLE Clientes (
    Id        INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioId INT NOT NULL UNIQUE,
    Rol       VARCHAR(20) NOT NULL DEFAULT 'Cliente' CHECK (Rol = 'Cliente'),
    CONSTRAINT FK_Clientes_Usuarios FOREIGN KEY (UsuarioId, Rol)
        REFERENCES Usuarios(Id, Rol) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- PERFIL TÉCNICO (1 a 1 con Usuarios) ----------
CREATE TABLE Tecnicos (
    Id                          INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioId                   INT NOT NULL UNIQUE,
    Rol                         VARCHAR(20) NOT NULL DEFAULT 'Tecnico' CHECK (Rol = 'Tecnico'),
    CategoriaId                 INT NOT NULL,
    EspecialidadId              INT NULL,
    AnosExperiencia             INT NOT NULL DEFAULT 0 CHECK (AnosExperiencia >= 0),
    PrecioBaseVisita            DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (PrecioBaseVisita >= 0),
    TarifaPorHoraMax            DECIMAL(12,2) NULL CHECK (TarifaPorHoraMax >= 0),
    EstadoVerificacion          VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
                                CHECK (EstadoVerificacion IN ('Pendiente','Verificado','Rechazado')),
    UrlDocumentoVerificacion    VARCHAR(500) NULL,
    TieneUbicacionFisica        TINYINT(1) NOT NULL DEFAULT 0,
    DireccionFisica             VARCHAR(250) NULL,
    ServiciosOfrecidos          TEXT NULL,
    NotasExpectativaPago        VARCHAR(500) NULL,
    CONSTRAINT FK_Tecnicos_Usuarios FOREIGN KEY (UsuarioId, Rol)
        REFERENCES Usuarios(Id, Rol) ON DELETE CASCADE,
    CONSTRAINT FK_Tecnicos_Categorias FOREIGN KEY (CategoriaId) REFERENCES Categorias(Id),
    CONSTRAINT FK_Tecnicos_Especialidades FOREIGN KEY (EspecialidadId) REFERENCES Especialidades(Id)
) ENGINE=InnoDB;

-- ---------- CATÁLOGO DEL TÉCNICO ----------
CREATE TABLE ItemsCatalogoTecnico (
    Id              INT AUTO_INCREMENT PRIMARY KEY,
    TecnicoId       INT NOT NULL,
    Titulo          VARCHAR(150) NOT NULL,
    Descripcion     VARCHAR(1000) NULL,
    Precio          DECIMAL(12,2) NOT NULL CHECK (Precio >= 0),
    UrlImagen       VARCHAR(500) NULL,
    FechaCreacion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ItemsCatalogo_Tecnicos FOREIGN KEY (TecnicoId) REFERENCES Tecnicos(Id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- SOLICITUDES DE SERVICIO ----------
CREATE TABLE SolicitudesServicio (
    Id                  INT AUTO_INCREMENT PRIMARY KEY,
    ClienteId           INT NOT NULL,
    TecnicoId           INT NULL,   -- puede quedar sin asignar
    CategoriaId         INT NOT NULL,
    DescripcionProblema VARCHAR(1000) NOT NULL,
    Especificaciones    VARCHAR(1000) NULL,
    TipoServicio        VARCHAR(30) NOT NULL
                        CHECK (TipoServicio IN ('Domicilio','Local')),
    Direccion           VARCHAR(250) NULL,
    FechaProgramada     DATETIME NULL,
    NivelUrgencia       VARCHAR(20) NOT NULL DEFAULT 'Normal'
                        CHECK (NivelUrgencia IN ('Baja','Normal','Alta','Urgente')),
    MetodoPago          VARCHAR(30) NULL,
    CostoEstimado       DECIMAL(12,2) NULL CHECK (CostoEstimado >= 0),
    Estado              VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
                        CHECK (Estado IN ('Pendiente','Aceptado','EnProceso','Completado','Cancelado')),
    FechaCreacion       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Solicitudes_Clientes FOREIGN KEY (ClienteId) REFERENCES Clientes(Id),
    CONSTRAINT FK_Solicitudes_Tecnicos FOREIGN KEY (TecnicoId) REFERENCES Tecnicos(Id),
    CONSTRAINT FK_Solicitudes_Categorias FOREIGN KEY (CategoriaId) REFERENCES Categorias(Id)
) ENGINE=InnoDB;

-- ---------- CHAT ----------
CREATE TABLE MensajesChat (
    Id                  INT AUTO_INCREMENT PRIMARY KEY,
    SolicitudServicioId INT NOT NULL,
    UsuarioRemitenteId  INT NOT NULL,
    UsuarioReceptorId   INT NOT NULL,
    Mensaje             VARCHAR(2000) NOT NULL,
    EnviadoEn           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Leido               TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT CK_Chat_UsuariosDistintos CHECK (UsuarioRemitenteId <> UsuarioReceptorId),
    CONSTRAINT FK_Chat_Solicitudes FOREIGN KEY (SolicitudServicioId) REFERENCES SolicitudesServicio(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Chat_Remitente FOREIGN KEY (UsuarioRemitenteId) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Chat_Receptor FOREIGN KEY (UsuarioReceptorId) REFERENCES Usuarios(Id)
) ENGINE=InnoDB;

-- ---------- RESEÑAS ----------
CREATE TABLE Resenas (
    Id                  INT AUTO_INCREMENT PRIMARY KEY,
    SolicitudServicioId INT NOT NULL UNIQUE,
    ClienteId           INT NOT NULL,
    TecnicoId           INT NOT NULL,
    Calificacion        TINYINT NOT NULL CHECK (Calificacion BETWEEN 1 AND 5),
    Comentario          VARCHAR(1000) NULL,
    FechaCreacion       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Resenas_Solicitudes FOREIGN KEY (SolicitudServicioId) REFERENCES SolicitudesServicio(Id),
    CONSTRAINT FK_Resenas_Clientes FOREIGN KEY (ClienteId) REFERENCES Clientes(Id),
    CONSTRAINT FK_Resenas_Tecnicos FOREIGN KEY (TecnicoId) REFERENCES Tecnicos(Id)
) ENGINE=InnoDB;

-- ---------- NOTIFICACIONES ----------
CREATE TABLE Notificaciones (
    Id                  INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioId           INT NOT NULL,
    SolicitudServicioId INT NULL,
    Titulo              VARCHAR(150) NOT NULL,
    Mensaje             VARCHAR(500) NULL,
    Leido               TINYINT(1) NOT NULL DEFAULT 0,
    FechaCreacion       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Notificaciones_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Notificaciones_Solicitudes FOREIGN KEY (SolicitudServicioId) REFERENCES SolicitudesServicio(Id)
) ENGINE=InnoDB;

-- ---------- ÍNDICES ÚTILES ----------
CREATE INDEX IX_SolicitudesServicio_Cliente     ON SolicitudesServicio(ClienteId, Estado);
CREATE INDEX IX_SolicitudesServicio_Tecnico     ON SolicitudesServicio(TecnicoId, Estado);
CREATE INDEX IX_Chat_Solicitud                  ON MensajesChat(SolicitudServicioId, EnviadoEn);
CREATE INDEX IX_Chat_Receptor_NoLeido           ON MensajesChat(UsuarioReceptorId, Leido);
CREATE INDEX IX_Notificaciones_Usuario          ON Notificaciones(UsuarioId, Leido);
CREATE INDEX IX_Resenas_Tecnico                 ON Resenas(TecnicoId);

-- ---------- VISTA: calificación y total de servicios ----------
CREATE VIEW vw_EstadisticasTecnico AS
SELECT t.Id AS TecnicoId,
       AVG(CAST(r.Calificacion AS DECIMAL(3,2))) AS CalificacionPromedio,
       COUNT(r.Id) AS TotalResenas
FROM Tecnicos t
LEFT JOIN Resenas r ON r.TecnicoId = t.Id
GROUP BY t.Id;

