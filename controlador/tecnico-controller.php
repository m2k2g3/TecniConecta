<?php
session_start();
header('Content-Type: application/json');
require_once '../modelo/index.php'; // Tu conexión a la base de datos

// =====================================================
// CONFIGURACIÓN DE SUBIDA DE ARCHIVOS
// =====================================================
define('RUTA_UPLOADS', __DIR__ . '/../uploads/documents/');
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
    mkdir(RUTA_UPLOADS, 0755, true);
}

$accion = $_GET['action'] ?? '';

// =====================================================
// OBTENER CATEGORÍAS
// =====================================================
if ($accion === 'categorias') {
    $res = $conexion->query("SELECT Id, Nombre FROM Categorias ORDER BY Nombre");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    exit;
}

// =====================================================
// OBTENER ESPECIALIDADES POR CATEGORÍA
// =====================================================
if ($accion === 'especialidades') {
    $catId = intval($_GET['categoriaId'] ?? 0);
    $stmt = $conexion->prepare("SELECT Id, Nombre FROM Especialidades WHERE CategoriaId = ? ORDER BY Nombre");
    $stmt->bind_param('i', $catId);
    $stmt->execute();
    $res = $stmt->get_result();
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
    exit;
}

// =====================================================
// REGISTRAR TÉCNICO
// =====================================================
if ($accion === 'registrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    
    try {
        // 1. Validar contraseñas
        if ($_POST['Contrasena'] !== $_POST['ConfirmarContrasena']) {
            throw new Exception('Las contraseñas no coinciden');
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
            throw new Exception('No se pudo guardar el archivo. Verifica los permisos de la carpeta uploads/documents');
        }

        // 4. Insertar en tabla Usuarios
        $nombreCompleto = trim($_POST['NombreCompleto']);
        $correo = trim($_POST['CorreoElectronico']);
        $telefono = trim($_POST['Telefono'] ?? '');
        $direccion = trim($_POST['Direccion'] ?? '');
        $ciudad = trim($_POST['Ciudad'] ?? '');
        $contrasenaHash = password_hash($_POST['Contrasena'], PASSWORD_DEFAULT);

        $stmt = $conexion->prepare("INSERT INTO Usuarios 
            (NombreCompleto, CorreoElectronico, ContrasenaHash, Rol, Telefono, Direccion, Ciudad)
            VALUES (?, ?, ?, 'Tecnico', ?, ?, ?)");
        $stmt->bind_param('ssssss', $nombreCompleto, $correo, $contrasenaHash, $telefono, $direccion, $ciudad);
        
        if (!$stmt->execute()) {
            // Eliminar archivo si falla el registro
            if (file_exists($rutaDestino)) unlink($rutaDestino);
            throw new Exception('Error al crear usuario: ' . $stmt->error);
        }
        
        $usuarioId = $conexion->insert_id;

        // 5. Insertar en tabla Tecnicos — EstadoVerificacion por defecto 'Pendiente'
        $categoriaId = intval($_POST['CategoriaId']);
        $especialidadId = !empty($_POST['EspecialidadId']) ? intval($_POST['EspecialidadId']) : null;
        $anosExperiencia = intval($_POST['AnosExperiencia'] ?? 0);
        $precioBase = floatval($_POST['PrecioBaseVisita'] ?? 0);
        $servicios = trim($_POST['ServiciosOfrecidos'] ?? '');

        $stmt = $conexion->prepare("INSERT INTO Tecnicos 
            (UsuarioId, Rol, CategoriaId, EspecialidadId, AnosExperiencia, PrecioBaseVisita, 
             UrlDocumentoVerificacion, ServiciosOfrecidos, EstadoVerificacion)
            VALUES (?, 'Tecnico', ?, ?, ?, ?, ?, ?, 'Pendiente')");
        $stmt->bind_param('iiidsss', 
            $usuarioId, $categoriaId, $especialidadId, $anosExperiencia, 
            $precioBase, $rutaRelativa, $servicios
        );
        
        if (!$stmt->execute()) {
            if (file_exists($rutaDestino)) unlink($rutaDestino);
            throw new Exception('Error al crear perfil de técnico: ' . $stmt->error);
        }
        
        $tecnicoId = $conexion->insert_id;

        // 6. Crear notificación: cuenta en revisión
        $titulo = 'Registro recibido — En revisión';
        $mensaje = '¡Bienvenido a TecniConecta! Tu cuenta está en proceso de verificación. Te avisaremos por correo cuando el administrador apruebe tu documentación.';
        
        $stmt = $conexion->prepare("INSERT INTO Notificaciones 
            (UsuarioId, Titulo, Mensaje, Leido)
            VALUES (?, ?, ?, 0)");
        $stmt->bind_param('iss', $usuarioId, $titulo, $mensaje);
        $stmt->execute();

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
function verificarEstadoVerificacion($usuarioId) {
    global $conexion;
    
    $stmt = $conexion->prepare("
        SELECT u.Rol, t.EstadoVerificacion 
        FROM Usuarios u
        LEFT JOIN Tecnicos t ON u.Id = t.UsuarioId
        WHERE u.Id = ?
    ");
    $stmt->bind_param('i', $usuarioId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    // Si es técnico y no está verificado, bloquear acceso
    if ($result['Rol'] === 'Tecnico' && $result['EstadoVerificacion'] !== 'Verificado') {
        $_SESSION['error_acceso'] = 'Tu cuenta aún no ha sido verificada por el administrador. Recibirás una notificación por correo cuando sea aprobada.';
        return false;
    }
    
    return true;
}
?>