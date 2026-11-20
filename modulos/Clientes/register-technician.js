// === VALIDACIÓN DE ARCHIVO ===
const form = document.getElementById('technicianForm');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('DocumentoVerificacion');
const fileInfo = document.getElementById('fileInfo');
const fileError = document.getElementById('fileError');
const successMessage = document.getElementById('successMessage');

// ✅ Req 1: Restricciones
const CONFIG = {
    tiposPermitidos: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    extensionesPermitidas: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    tamanoMaxMB: 20,
    tamanoMaxBytes: 20 * 1024 * 1024
};

// Eventos de subida
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

function validarArchivo() {
    const archivo = fileInput.files[0];
    if (!archivo) return;
    
    fileError.style.display = 'none';
    fileInfo.textContent = '';

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

    fileInfo.textContent = `✅ ${archivo.name} — ${(archivo.size / 1048576).toFixed(2)} MB`;
}

function mostrarError(msg) {
    fileError.textContent = msg;
    fileError.style.display = 'block';
}

// Enviar formulario
form.addEventListener('submit', async e => {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    try {
        const res = await fetch('../controlador/tecnico-controller.php?action=registrar', {
            method: 'POST',
            body: formData
        });
        
        const resultado = await res.json();
        
        if (resultado.exito) {
            form.style.display = 'none';
            successMessage.style.display = 'block';
        } else {
            alert('Error: ' + resultado.mensaje);
        }
    } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor');
    }
});

// Cargar categorías y especialidades dinámicamente
document.addEventListener('DOMContentLoaded', async () => {
    const catSelect = document.getElementById('CategoriaId');
    const espSelect = document.getElementById('EspecialidadId');
    
    try {
        const res = await fetch('../controlador/tecnico-controller.php?action=categorias');
        const categorias = await res.json();
        
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.Id;
            opt.textContent = cat.Nombre;
            catSelect.appendChild(opt);
        });
        
        // Al cambiar categoría, cargar especialidades
        catSelect.addEventListener('change', async () => {
            const catId = catSelect.value;
            espSelect.innerHTML = '<option value="">Selecciona especialidad</option>';
            
            if (catId) {
                const res = await fetch(`../controlador/tecnico-controller.php?action=especialidades&categoriaId=${catId}`);
                const especialidades = await res.json();
                
                especialidades.forEach(esp => {
                    const opt = document.createElement('option');
                    opt.value = esp.Id;
                    opt.textContent = esp.Nombre;
                    espSelect.appendChild(opt);
                });
            }
        });
    } catch (err) {
        console.error('Error cargando datos:', err);
    }
});
