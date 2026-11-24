<?php
require_once __DIR__ . '/../middleware/guard.php';
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../../config/conexion.php';

switch ($_GET['accion'] ?? '') {
    case 'login':            login();            break;
    case 'logout':           logout();           break;
    case 'sesion':           sesion();           break;
    case 'registro-cliente': registrarCliente(); break;
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

    $u = Usuario::buscarPorEmail($email);
    if (!$u || !password_verify($password, $u['ContrasenaHash'])) {
        responderJson(['ok' => false, 'mensaje' => 'Correo o contraseña incorrectos'], 401);
    }

    $rol = strtolower($u['Rol']);
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
        'id'     => (int)$u['Id'],
        'nombre' => $u['NombreCompleto'],
        'email'  => $u['CorreoElectronico'],
        'rol'    => $rol,
    ];

    responderJson([
        'ok'       => true,
        'usuario'  => ['nombre' => $u['NombreCompleto'], 'rol' => $rol],
        'redirect' => RUTAS_POR_ROL[$rol],
    ]);
}

function registrarCliente(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderJson(['ok' => false, 'mensaje' => 'Método no permitido'], 405);
    }
    $datos     = json_decode(file_get_contents('php://input'), true) ?? [];
    $nombre    = trim($datos['nombre'] ?? '');
    $email     = strtolower(trim($datos['correo'] ?? $datos['email'] ?? ''));
    $telefono  = trim($datos['telefono'] ?? '');
    $ciudad    = trim($datos['ciudad'] ?? '');
    $direccion = trim($datos['direccion'] ?? '');
    $password  = (string)($datos['password'] ?? '');

    if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
        responderJson(['ok' => false, 'mensaje' => 'Por favor completa todos los campos requeridos con datos válidos'], 422);
    }

    try {
        $conexion = obtenerConexion();
        
        $st = $conexion->prepare('SELECT Id FROM Usuarios WHERE CorreoElectronico = ? LIMIT 1');
        $st->execute([$email]);
        if ($st->fetch()) {
            responderJson(['ok' => false, 'mensaje' => 'Este correo electrónico ya se encuentra registrado'], 409);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        
        $conexion->beginTransaction();

        $stUser = $conexion->prepare('INSERT INTO Usuarios (NombreCompleto, CorreoElectronico, ContrasenaHash, Rol, Telefono, Direccion, Ciudad, EstaActivo) VALUES (?, ?, ?, "Cliente", ?, ?, ?, 1)');
        $stUser->execute([$nombre, $email, $hash, $telefono, $direccion, $ciudad]);
        $usuarioId = (int)$conexion->lastInsertId();

        $stCliente = $conexion->prepare('INSERT INTO Clientes (UsuarioId, Rol) VALUES (?, "Cliente")');
        $stCliente->execute([$usuarioId]);

        $conexion->commit();

        iniciarSesionSegura();
        session_regenerate_id(true);
        $_SESSION['usuario'] = [
            'id'     => $usuarioId,
            'nombre' => $nombre,
            'email'  => $email,
            'rol'    => 'cliente'
        ];

        responderJson([
            'ok'       => true,
            'mensaje'  => '¡Registro exitoso! Redirigiendo a tu perfil...',
            'redirect' => RUTAS_POR_ROL['cliente'],
            'usuario'  => $_SESSION['usuario']
        ]);
    } catch (Exception $e) {
        if (isset($conexion) && $conexion->inTransaction()) {
            $conexion->rollBack();
        }
        responderJson(['ok' => false, 'mensaje' => 'Error al registrar usuario: ' . $e->getMessage()], 500);
    }
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
