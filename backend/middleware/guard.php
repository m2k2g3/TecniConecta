<?php

const RUTAS_POR_ROL = [
    'admin'   => 'vistas/admin/dashboard.html',
    'tecnico' => 'vistas/tecnico/dashboard.html',
    'cliente' => 'vistas/cliente/profile-client.html',
];

function iniciarSesionSegura(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params(['path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
        session_start();
    }
}

function responderJson(array $datos, int $codigo = 200): void {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function usuarioActual(): ?array {
    iniciarSesionSegura();
    return $_SESSION['usuario'] ?? null;
}

function exigirRol(array $rolesPermitidos): array {
    $u = usuarioActual();
    if (!$u) {
        responderJson(['ok' => false, 'mensaje' => 'Inicia sesión para continuar'], 401);
    }
    if (!in_array($u['rol'], $rolesPermitidos, true)) {
        responderJson(['ok' => false, 'mensaje' => 'No tienes permiso para esto'], 403);
    }
    return $u;
}
