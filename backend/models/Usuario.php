<?php
require_once __DIR__ . '/../../config/conexion.php';

class Usuario {
    public static function buscarPorEmail(string $email): ?array {
        $sql = 'SELECT u.Id, u.NombreCompleto, u.CorreoElectronico, u.ContrasenaHash,
                       u.Rol, u.EstaActivo, t.EstadoVerificacion
                FROM Usuarios u
                LEFT JOIN Tecnicos t ON t.UsuarioId = u.Id
                WHERE u.CorreoElectronico = :email
                LIMIT 1';
        $conexion = obtenerConexion();
        $st = $conexion->prepare($sql);
        $st->execute([':email' => $email]);
        return $st->fetch() ?: null;
    }

    public static function buscarPorId(int $id): ?array {
        $sql = 'SELECT Id, NombreCompleto, CorreoElectronico, Rol, Telefono, Direccion, Ciudad, UrlFotoPerfil, EstaActivo
                FROM Usuarios
                WHERE Id = ?
                LIMIT 1';
        $conexion = obtenerConexion();
        $st = $conexion->prepare($sql);
        $st->execute([$id]);
        return $st->fetch() ?: null;
    }
}

// Mantener compatibilidad con funciones previas si algún script la llama directamente
if (!function_exists('buscarUsuarioPorEmail')) {
    function buscarUsuarioPorEmail(string $email): ?array {
        return Usuario::buscarPorEmail($email);
    }
}
