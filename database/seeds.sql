-- =====================================================
-- 2. INSERCIÓN DE DATOS DE PRUEBA (DML)
-- Contraseña general para todos los usuarios de prueba: password123
-- =====================================================

-- 2.1. Categorías y Especialidades
INSERT INTO Categorias (Nombre) VALUES 
('Plomería'),
('Electricidad'),
('Tecnología y Computación');

INSERT INTO Especialidades (CategoriaId, Nombre) VALUES 
(1, 'Reparación de tuberías y fugas'),
(1, 'Instalación de grifería y sanitarios'),
(2, 'Instalación de iluminación LED'),
(2, 'Reparación de tableros eléctricos'),
(3, 'Mantenimiento de computadores'),
(3, 'Redes y Wi-Fi');

-- 2.2. Usuarios (Clave para todos: password123)
INSERT INTO Usuarios (NombreCompleto, CorreoElectronico, ContrasenaHash, Rol, Telefono, Direccion, Ciudad, EstaActivo) VALUES 
('Carlos Administrador', 'admin@servicios.com', '$2y$10$rZHiANScwL4Hiq/CNZMfEuVn9Sr0m7dRoeKouFk4GwgkTQFEZmfCe', 'Admin', '3001234567', 'Calle Principal #10', 'Bogotá', 1),
('María Pérez (Cliente)', 'maria.cliente@gmail.com', '$2y$10$rZHiANScwL4Hiq/CNZMfEuVn9Sr0m7dRoeKouFk4GwgkTQFEZmfCe', 'Cliente', '3109876543', 'Cra 15 #85-20', 'Bogotá', 1),
('Juan Gómez (Cliente)', 'juan.gomez@gmail.com', '$2y$10$rZHiANScwL4Hiq/CNZMfEuVn9Sr0m7dRoeKouFk4GwgkTQFEZmfCe', 'Cliente', '3201112233', 'Av. 68 #45-12', 'Bogotá', 1),
('Pedro Técnico Plomero', 'pedro.plomero@taller.com', '$2y$10$rZHiANScwL4Hiq/CNZMfEuVn9Sr0m7dRoeKouFk4GwgkTQFEZmfCe', 'Tecnico', '3154445566', 'Calle 50 #20-10', 'Bogotá', 1),
('Ana Técnica Redes', 'ana.redes@tech.com', '$2y$10$rZHiANScwL4Hiq/CNZMfEuVn9Sr0m7dRoeKouFk4GwgkTQFEZmfCe', 'Tecnico', '3187778899', 'Calle 100 #15-40', 'Bogotá', 1);

-- 2.3. Perfiles de Clientes
INSERT INTO Clientes (UsuarioId, Rol) VALUES 
(2, 'Cliente'), 
(3, 'Cliente');

-- 2.4. Perfiles de Técnicos
INSERT INTO Tecnicos (UsuarioId, Rol, CategoriaId, EspecialidadId, AnosExperiencia, PrecioBaseVisita, TarifaPorHoraMax, EstadoVerificacion, TieneUbicacionFisica, ServiciosOfrecidos) VALUES 
(4, 'Tecnico', 1, 1, 5, 40000.00, 60000.00, 'Verificado', 1, 'Destape de tuberías, detección de fugas con geófono, cambio de grifería.'),
(5, 'Tecnico', 3, 5, 3, 50000.00, 80000.00, 'Verificado', 0, 'Formateo, limpieza de hardware, instalación de redes LAN y Wi-Fi doméstico.');

-- 2.5. Catálogo del Técnico
INSERT INTO ItemsCatalogoTecnico (TecnicoId, Titulo, Descripcion, Precio) VALUES 
(1, 'Destape de sifón con sonda', 'Limpieza y destape mecánico de tuberías en lavaplatos o baños.', 60000.00),
(1, 'Instalación de sanitario nuevo', 'Montaje completo, sellado y pruebas de funcionamiento.', 90000.00),
(2, 'Mantenimiento preventivo PC', 'Limpieza interna, cambio de pasta térmica y optimización de software.', 85000.00);

-- 2.6. Solicitudes de Servicio
INSERT INTO SolicitudesServicio (ClienteId, TecnicoId, CategoriaId, DescripcionProblema, Especificaciones, TipoServicio, Direccion, FechaProgramada, NivelUrgencia, MetodoPago, CostoEstimado, Estado) VALUES 
(1, 1, 1, 'Tubería del lavaplatos goteando fuertemente', 'Es una tubería de PVC de 2 pulgadas antigua.', 'Domicilio', 'Cra 15 #85-20', '2026-06-10 10:00:00', 'Alta', 'Efectivo', 100000.00, 'Completado'),
(2, 2, 3, 'El portátil se apaga solo al abrir programas pesados', 'Core i7 de 9na generación', 'Local', 'Calle 100 #15-40', '2026-06-15 14:00:00', 'Normal', 'Transferencia', 85000.00, 'EnProceso');

-- 2.7. Chat
INSERT INTO MensajesChat (SolicitudServicioId, UsuarioRemitenteId, UsuarioReceptorId, Mensaje, Leido) VALUES 
(1, 2, 4, 'Hola Pedro, ¿puedes venir hoy en la mañana?', 1),
(1, 4, 2, 'Hola María, claro que sí, estaré allá sobre las 10:00 AM.', 1),
(1, 2, 4, 'Perfecto, aquí te espero.', 1);

-- 2.8. Reseñas
INSERT INTO Resenas (SolicitudServicioId, ClienteId, TecnicoId, Calificacion, Comentario) VALUES 
(1, 1, 1, 5, 'Excelente servicio, muy puntual y dejó todo limpio.');

-- 2.9. Notificaciones
INSERT INTO Notificaciones (UsuarioId, SolicitudServicioId, Titulo, Mensaje, Leido) VALUES 
(4, 1, '¡Nueva solicitud asignada!', 'Tienes una solicitud de plomería pendiente.', 1),
(2, 1, 'Servicio completado', 'Tu servicio de plomería ha sido marcado como completado.', 0);
