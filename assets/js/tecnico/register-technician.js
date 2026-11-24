// === VALIDACIÓN Y REGISTRO DE TÉCNICO ===
const form           = document.getElementById('technicianForm');
const uploadArea     = document.getElementById('uploadArea');
const fileInput      = document.getElementById('DocumentoVerificacion');
const fileName       = document.getElementById('fileName');
const fileInfo       = document.getElementById('fileInfo');
const fileError      = document.getElementById('fileError');
const successMessage = document.getElementById('successMessage');

// Determinar URL del endpoint PHP de forma dinámica y robusta
const script = document.currentScript || document.querySelector('script[src*="register-technician.js"]');
const API    = script ? new URL('../../backend/controllers/TecnicoController.php', script.src).href : '../../backend/controllers/TecnicoController.php';

// Configuración de restricciones
const CONFIG = {
    tiposPermitidos: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    extensionesPermitidas: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    tamanoMaxMB: 20,
    tamanoMaxBytes: 20 * 1024 * 1024
};

// Eventos de subida
if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.classList.add('drag-active');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-active');
    });
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('drag-active');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            validarArchivo();
        }
    });

    fileInput.addEventListener('change', validarArchivo);
}

function validarArchivo() {
    if (!fileInput || !fileInput.files.length) return;
    const archivo = fileInput.files[0];
    if (!archivo) return;
    
    if (fileError) fileError.style.display = 'none';
    if (fileInfo) fileInfo.textContent = '';
    if (fileName) fileName.textContent = '';

    // Validar extensión
    const ext = '.' + archivo.name.split('.').pop().toLowerCase();
    if (!CONFIG.extensionesPermitidas.includes(ext) && !CONFIG.tiposPermitidos.includes(archivo.type)) {
        mostrarError(`Formato no válido. Usa: ${CONFIG.extensionesPermitidas.join(', ')}`);
        fileInput.value = '';
        return;
    }

    // Validar tamaño
    if (archivo.size > CONFIG.tamanoMaxBytes) {
        mostrarError(`Archivo muy pesado. Máx: ${CONFIG.tamanoMaxMB}MB — Tu archivo: ${(archivo.size / 1048576).toFixed(2)}MB`);
        fileInput.value = '';
        return;
    }

    const textoExito = `✅ ${archivo.name} — ${(archivo.size / 1048576).toFixed(2)} MB`;
    if (fileInfo) fileInfo.textContent = textoExito;
    if (fileName) fileName.textContent = textoExito;
}

function mostrarError(msg) {
    if (fileError) {
        fileError.textContent = msg;
        fileError.style.display = 'block';
    } else {
        alert(msg);
    }
}

// Enviar formulario
if (form) {
    form.addEventListener('submit', async e => {
        e.preventDefault();
        
        const contrasena = document.getElementById('Contrasena')?.value;
        const confirmContrasena = document.getElementById('ConfirmarContrasena')?.value;

        if (contrasena !== confirmContrasena) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const formData = new FormData(form);
        
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando registro...';
            }

            const res = await fetch(`${API}?action=registrar`, {
                method: 'POST',
                body: formData
            });
            
            const resultado = await res.json();
            
            if (resultado.exito) {
                form.style.display = 'none';
                if (successMessage) successMessage.style.display = 'block';
            } else {
                alert('Error: ' + resultado.mensaje);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '✅ Completar Registro';
                }
            }
        } catch (err) {
            console.error(err);
            alert('Error al conectar con el servidor. Verifica que Laragon esté iniciado.');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '✅ Completar Registro';
            }
        }
    });
}

// Cargar categorías y especialidades dinámicamente
document.addEventListener('DOMContentLoaded', async () => {
    const catSelect = document.getElementById('CategoriaId');
    const espSelect = document.getElementById('EspecialidadId');
    
    if (!catSelect) return;

    try {
        const res = await fetch(`${API}?action=categorias`);
        const categorias = await res.json();
        
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.Id;
            opt.textContent = cat.Nombre;
            catSelect.appendChild(opt);
        });
        
        // Al cambiar categoría, cargar especialidades
        if (espSelect) {
            catSelect.addEventListener('change', async () => {
                const catId = catSelect.value;
                espSelect.innerHTML = '<option value="">Selecciona especialidad (opcional)</option>';
                
                if (catId) {
                    try {
                        const resEsp = await fetch(`${API}?action=especialidades&categoriaId=${catId}`);
                        const especialidades = await resEsp.json();
                        
                        especialidades.forEach(esp => {
                            const opt = document.createElement('option');
                            opt.value = esp.Id;
                            opt.textContent = esp.Nombre;
                            espSelect.appendChild(opt);
                        });
                    } catch (err) {
                        console.error('Error cargando especialidades:', err);
                    }
                }
            });
        }
    } catch (err) {
        console.error('Error cargando categorías:', err);
    }
});
