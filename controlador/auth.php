<?php
require_once __DIR__ . '/guard.php';
require_once __DIR__ . '/../model/usuario.php';

switch ($_GET['accion'] ?? '') {
    case 'login':  login();  break;
    case 'logout': logout(); break;
    case 'sesion': sesion(); break;
    default: responderJson(['ok' => false, 'mensaje' => 'Acción no válida'], 400);
}

function login(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJson(['ok' => false, 'mensaje' => 'Método no permitido'], 405);
    }
    $datos    = json_decode(file_get_contents('php://input'), true) ?? [];
    $email    = strtolower(trim($datos['email'] ?? ''));
    $password = (string)($datos['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        responderJson(['ok' => false, 'mensaje' => 'Escribe un correo y una contraseña válidos'], 422);
    }

    $u = buscarUsuarioPorEmail($email);
    if (!$u || !password_verify($password, $u['ContrasenaHash'])) {
        responderJson(['ok' => false, 'mensaje' => 'Correo o contraseña incorrectos'], 401);
    }

    // Contraseña correcta: ahora se revisa el estado de la cuenta
    $rol = strtolower($u['Rol']);   // 'Cliente' -> 'cliente'
    if (!isset(RUTAS_POR_ROL[$rol])) {
        responderJson(['ok' => false, 'mensaje' => 'Tu cuenta no tiene un rol válido'], 403);
    }
    if (!$u['EstaActivo']) {
        responderJson(['ok' => false, 'mensaje' => 'Tu cuenta está desactivada. Contacta al administrador'], 403);
    }
    if ($rol === 'tecnico' && $u['EstadoVerificacion'] !== 'Verificado') {
        $mensaje = $u['EstadoVerificacion'] === 'Rechazado'
            ? 'Tu solicitud fue rechazada. Contacta al administrador'
            : 'Tu cuenta está en revisión. El administrador debe validar tus documentos';
        responderJson(['ok' => false, 'mensaje' => $mensaje], 403);
    }

    iniciarSesionSegura();
    session_regenerate_id(true);
    $_SESSION['usuario'] = [
        'id' => (int)$u['Id'], 'nombre' => $u['NombreCompleto'],
        'email' => $u['CorreoElectronico'], 'rol' => $rol,
    ];

    responderJson([
        'ok'       => true,
        'usuario'  => ['nombre' => $u['NombreCompleto'], 'rol' => $rol],
        'redirect' => RUTAS_POR_ROL[$rol],
    ]);
}

function logout(): void {
    iniciarSesionSegura();
    $_SESSION = [];
    $c = session_get_cookie_params();
    setcookie(session_name(), '', time() - 3600, $c['path'], $c['domain'], $c['secure'], $c['httponly']);
    session_destroy();
    responderJson(['ok' => true]);
}

function sesion(): void {
    $u = usuarioActual();
    if (!$u) {
        responderJson(['ok' => false], 401);
    }
    responderJson(['ok' => true, 'usuario' => $u, 'redirect' => RUTAS_POR_ROL[$u['rol']]]);
}