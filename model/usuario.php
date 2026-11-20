<?php
require_once __DIR__ . '/conexion.php';

function buscarUsuarioPorEmail(string $email): ?array {
    $sql = 'SELECT u.Id, u.NombreCompleto, u.CorreoElectronico, u.ContrasenaHash,
                   u.Rol, u.EstaActivo, t.EstadoVerificacion
            FROM Usuarios u
            LEFT JOIN Tecnicos t ON t.UsuarioId = u.Id
            WHERE u.CorreoElectronico = :email
            LIMIT 1';
    $st = obtenerConexion()->prepare($sql);
    $st->execute([':email' => $email]);
    return $st->fetch() ?: null;
}