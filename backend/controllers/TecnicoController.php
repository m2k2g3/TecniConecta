<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/conexion.php'; 

try {
    $conexion = obtenerConexion();
} catch (Exception $e) {
    echo json_encode([
        'exito' => false,
        'mensaje' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ]);
    exit;
}

// =====================================================
// CONFIGURACIÓN DE SUBIDA DE ARCHIVOS
// =====================================================
define('RUTA_UPLOADS', __DIR__ . '/../../uploads/documents/');
define('TAMANO_MAXIMO', 20 * 1024 * 1024); // 20 MB

$tiposPermitidos = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
];

$extensionesPermitidas = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

// Crear carpeta si no existe
if (!file_exists(RUTA_UPLOADS)) {
    @mkdir(RUTA_UPLOADS, 0755, true);
}

$accion = $_GET['action'] ?? '';

// =====================================================
// OBTENER CATEGORÍAS
// =====================================================
if ($accion === 'categorias') {
    try {
        $res = $conexion->query("SELECT Id, Nombre FROM Categorias ORDER BY Nombre");
        echo json_encode($res->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        echo json_encode([]);
    }
    exit;
}

// =====================================================
// OBTENER ESPECIALIDADES POR CATEGORÍA
// =====================================================
if ($accion === 'especialidades') {
    $catId = intval($_GET['categoriaId'] ?? 0);
    try {
        $stmt = $conexion->prepare("SELECT Id, Nombre FROM Especialidades WHERE CategoriaId = ? ORDER BY Nombre");
        $stmt->execute([$catId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        echo json_encode([]);
    }
    exit;
}

// =====================================================
// REGISTRAR TÉCNICO
// =====================================================
if ($accion === 'registrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    
    try {
        // 1. Validar contraseñas
        $contrasena = $_POST['Contrasena'] ?? '';
        $confirmarContrasena = $_POST['ConfirmarContrasena'] ?? '';
        if ($contrasena === '' || $contrasena !== $confirmarContrasena) {
            throw new Exception('Las contraseñas no coinciden o están vacías');
        }

        // 2. Validar archivo subido
        if (!isset($_FILES['DocumentoVerificacion']) || 
            $_FILES['DocumentoVerificacion']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('Debes subir un documento de acreditación');
        }

        $archivo = $_FILES['DocumentoVerificacion'];
        
        // Validar tamaño
        if ($archivo['size'] > TAMANO_MAXIMO) {
            throw new Exception('El archivo excede los 20 MB');
        }

        // Validar extensión y tipo
        $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $extensionesPermitidas)) {
            throw new Exception('Formato de archivo no permitido. Usa: PDF, JPG, PNG o WEBP');
        }
        if (!in_array($archivo['type'], $tiposPermitidos)) {
            throw new Exception('Tipo de archivo no válido');
        }

        // 3. Generar nombre único y guardar el archivo
        $nombreUnico = 'doc_tec_' . uniqid() . '_' . time() . '.' . $extension;
        $rutaDestino = RUTA_UPLOADS . $nombreUnico;
        $rutaRelativa = 'uploads/documents/' . $nombreUnico;

        if (!move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
            throw new Exception('No se pudo guardar el archivo en el servidor. Verifica los permisos de carpeta');
        }

        // 4. Insertar en tabla Usuarios
        $nombreCompleto = trim($_POST['NombreCompleto'] ?? '');
        $correo = strtolower(trim($_POST['CorreoElectronico'] ?? ''));
        $telefono = trim($_POST['Telefono'] ?? '');
        $direccion = trim($_POST['Direccion'] ?? '');
        $ciudad = trim($_POST['Ciudad'] ?? '');

        if ($nombreCompleto === '' || $correo === '') {
            throw new Exception('El nombre completo y correo son obligatorios');
        }

        // Verificar si el correo ya existe
        $checkStmt = $conexion->prepare("SELECT Id FROM Usuarios WHERE CorreoElectronico = ? LIMIT 1");
        $checkStmt->execute([$correo]);
        if ($checkStmt->fetch()) {
            if (file_exists($rutaDestino)) unlink($rutaDestino);
            throw new Exception('Este correo electrónico ya se encuentra registrado');
        }

        $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);

        $stmt = $conexion->prepare("INSERT INTO Usuarios 
            (NombreCompleto, CorreoElectronico, ContrasenaHash, Rol, Telefono, Direccion, Ciudad, EstaActivo)
            VALUES (?, ?, ?, 'Tecnico', ?, ?, ?, 1)");
        $stmt->execute([$nombreCompleto, $correo, $contrasenaHash, $telefono, $direccion, $ciudad]);
        
        $usuarioId = (int)$conexion->lastInsertId();

        // 5. Insertar en tabla Tecnicos — EstadoVerificacion por defecto 'Pendiente'
        $categoriaId = intval($_POST['CategoriaId'] ?? 0);
        $especialidadId = !empty($_POST['EspecialidadId']) ? intval($_POST['EspecialidadId']) : null;
        $anosExperiencia = intval($_POST['AnosExperiencia'] ?? 0);
        $precioBase = floatval($_POST['PrecioBaseVisita'] ?? 0);
        $servicios = trim($_POST['ServiciosOfrecidos'] ?? $_POST['EspecialidadDetallada'] ?? '');

        if ($categoriaId <= 0) {
            throw new Exception('Debes seleccionar una categoría principal');
        }

        $stmt = $conexion->prepare(
            "INSERT INTO Tecnicos 
            (UsuarioId, Rol, CategoriaId, EspecialidadId, AnosExperiencia, PrecioBaseVisita, UrlDocumentoVerificacion, ServiciosOfrecidos, EstadoVerificacion)
            VALUES (?, 'Tecnico', ?, ?, ?, ?, ?, ?, 'Pendiente')");
        $stmt->execute([
            $usuarioId, $categoriaId, $especialidadId, $anosExperiencia, 
            $precioBase, $rutaRelativa, $servicios
        ]);
        
        $tecnicoId = (int)$conexion->lastInsertId();

        // 6. Crear notificación: cuenta en revisión
        $titulo = 'Registro recibido — En revisión';
        $mensaje = '¡Bienvenido a TecniConecta! Tu cuenta está en proceso de verificación. Te avisaremos por correo cuando el administrador apruebe tu documentación.';
        
        $stmt = $conexion->prepare("INSERT INTO Notificaciones 
            (UsuarioId, Titulo, Mensaje, Leido)
            VALUES (?, ?, ?, 0)");
        $stmt->execute([$usuarioId, $titulo, $mensaje]);

        // 7. Respuesta exitosa
        echo json_encode([
            'exito' => true,
            'mensaje' => 'Registro completado exitosamente. Tu cuenta está en revisión.'
        ]);

    } catch (Exception $e) {
        echo json_encode([
            'exito' => false,
            'mensaje' => $e->getMessage()
        ]);
    }
    exit;
}

// =====================================================
// VERIFICAR ESTADO DE CUENTA AL INICIAR SESIÓN
// =====================================================
function verificarEstadoVerificacion(int $usuarioId): bool {
    global $conexion;
    if (!$conexion) return false;
    
    $stmt = $conexion->prepare("
        SELECT u.Rol, t.EstadoVerificacion 
        FROM Usuarios u
        LEFT JOIN Tecnicos t ON u.Id = t.UsuarioId
        WHERE u.Id = ?
    ");

    $stmt->execute([$usuarioId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        return false;
    }

    if ($result['Rol'] === 'Tecnico' && $result['EstadoVerificacion'] !== 'Verificado') {
        $_SESSION['error_acceso'] = 'Tu cuenta aún no ha sido verificada por el administrador. Recibirás una notificación por correo cuando sea aprobada.';
        return false;
    }
    
    return true;
}
