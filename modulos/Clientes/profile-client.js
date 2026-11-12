/**
 * =====================================================================
 * GESTIÓN DE PERFIL Y ACTUALIZACIÓN DE DATOS - TECNICONECTA
 * Módulo de Cliente
 * =====================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // Claves de almacenamiento local
    const STORAGE_KEY_CLIENTES = 'db_clientes_tecni';
    const STORAGE_KEY_SESION = 'usuario_activo';

    // Elementos del DOM - Alertas
    const alertContainer = document.getElementById('alertContainer');

    // Elementos del DOM - Resumen de Perfil (Columna Izquierda)
    const avatarImg = document.getElementById('avatarImg');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    const inputAvatar = document.getElementById('inputAvatar');
    const resumenNombre = document.getElementById('resumenNombre');
    const resumenCorreo = document.getElementById('resumenCorreo');
    const resumenTelefono = document.getElementById('resumenTelefono');
    const resumenCiudad = document.getElementById('resumenCiudad');
    const resumenDireccion = document.getElementById('resumenDireccion');

    // Elementos del DOM - Formulario de Datos Personales
    const formPerfil = document.getElementById('formPerfil');
    const inputNombre = document.getElementById('nombre');
    const inputCorreo = document.getElementById('correo');
    const inputTelefono = document.getElementById('telefono');
    const inputCiudad = document.getElementById('ciudad');
    const inputDireccion = document.getElementById('direccion');
    const btnGuardarDatos = document.getElementById('btnGuardarDatos');
    const btnGuardarText = document.getElementById('btnGuardarText');
    const btnGuardarSpinner = document.getElementById('btnGuardarSpinner');

    // Elementos del DOM - Formulario de Actualización de Correo (HU-7)
    const formCorreo = document.getElementById('formCorreo');
    const correoActualDisplay = document.getElementById('correoActualDisplay');
    const inputNuevoCorreo = document.getElementById('nuevoCorreo');
    const inputPassConfirmCorreo = document.getElementById('passwordConfirmCorreo');
    const btnCambiarCorreo = document.getElementById('btnCambiarCorreo');
    const btnCorreoText = document.getElementById('btnCorreoText');
    const btnCorreoSpinner = document.getElementById('btnCorreoSpinner');

    // Elementos del DOM - Formulario de Contraseña
    const formPassword = document.getElementById('formPassword');
    const inputPassActual = document.getElementById('passwordActual');
    const inputPassNuevo = document.getElementById('passwordNuevo');
    const inputPassConfirm = document.getElementById('passwordConfirm');
    const btnCambiarPass = document.getElementById('btnCambiarPass');
    const btnPassText = document.getElementById('btnPassText');
    const btnPassSpinner = document.getElementById('btnPassSpinner');

    // Botones de mostrar/ocultar contraseña
    configurarTogglePassword('togglePassCorreo', 'passwordConfirmCorreo', 'iconPassCorreo');
    configurarTogglePassword('togglePassActual', 'passwordActual', 'iconPassActual');
    configurarTogglePassword('togglePassNuevo', 'passwordNuevo', 'iconPassNuevo');
    configurarTogglePassword('togglePassConfirm', 'passwordConfirm', 'iconPassConfirm');

    // Botón de salir
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }

    /**
     * Variable en memoria que almacena el usuario en sesión actual
     */
    let usuarioActual = null;

    /**
     * Inicializar módulo cargando la sesión del cliente
     */
    iniciarModulo();

    function iniciarModulo() {
        // 1. Intentar cargar sesión activa
        let sesion = JSON.parse(sessionStorage.getItem(STORAGE_KEY_SESION)) ||
                     JSON.parse(localStorage.getItem(STORAGE_KEY_SESION));

        let clientes = JSON.parse(localStorage.getItem(STORAGE_KEY_CLIENTES)) || [];

        if (sesion && sesion.correo) {
            // Buscar la versión más actualizada en la lista de clientes
            const encontrado = clientes.find(c => c.correo.toLowerCase() === sesion.correo.toLowerCase());
            usuarioActual = encontrado || sesion;
        } else if (clientes.length > 0) {
            // Si no hay sesión explícita pero hay usuarios registrados (ej. pruebas directas), tomar el último
            usuarioActual = clientes[clientes.length - 1];
            guardarSesionActiva(usuarioActual);
        } else {
            // Si la base local está completamente vacía, creamos un usuario inicial para demostración inmediata
            usuarioActual = {
                id: Date.now(),
                nombre: 'Ricardo Espitia',
                correo: 'ricardo.espitia@tecniconecta.com',
                telefono: '3124567890',
                ciudad: 'Duitama',
                direccion: 'Carrera 15 # 12-45, Barrio Solano',
                password: 'password123',
                rol: 'Cliente',
                estado: 'Activo',
                fechaRegistro: new Date().toISOString(),
                fotoPerfil: ''
            };
            clientes.push(usuarioActual);
            localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
            guardarSesionActiva(usuarioActual);
        }

        // Renderizar los datos en pantalla
        renderizarDatosEnVista(usuarioActual);
    }

    /**
     * Pinta en la interfaz gráfica la información del cliente
     */
    function renderizarDatosEnVista(user) {
        if (!user) return;

        // Resumen
        resumenNombre.textContent = user.nombre || 'Sin nombre';
        resumenCorreo.textContent = user.correo || 'Sin correo';
        resumenTelefono.textContent = user.telefono || '--';
        resumenCiudad.textContent = user.ciudad || '--';
        resumenDireccion.textContent = user.direccion || '--';

        // Inputs del formulario de información
        inputNombre.value = user.nombre || '';
        inputCorreo.value = user.correo || '';
        if (correoActualDisplay) {
            correoActualDisplay.value = user.correo || '';
        }
        inputTelefono.value = user.telefono || '';
        inputCiudad.value = user.ciudad || '';
        inputDireccion.value = user.direccion || '';

        // Avatar
        actualizarAvatarUI(user.nombre, user.fotoPerfil);
    }

    /**
     * Muestra la foto o el placeholder con iniciales
     */
    function actualizarAvatarUI(nombre, urlFoto) {
        if (urlFoto && urlFoto.trim() !== '') {
            avatarImg.src = urlFoto;
            avatarImg.classList.remove('d-none');
            avatarPlaceholder.classList.add('d-none');
        } else {
            avatarImg.classList.add('d-none');
            avatarPlaceholder.classList.remove('d-none');

            // Extraer las dos primeras iniciales
            const partes = (nombre || 'TC').trim().split(/\s+/);
            let iniciales = 'TC';
            if (partes.length === 1 && partes[0].length > 0) {
                iniciales = partes[0].substring(0, 2).toUpperCase();
            } else if (partes.length >= 2) {
                iniciales = (partes[0][0] + partes[1][0]).toUpperCase();
            }
            avatarPlaceholder.textContent = iniciales;
        }
    }

    /**
     * Sube y previsualiza una foto de perfil en base64
     */
    inputAvatar.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validaciones
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            mostrarAlerta('Formato no permitido. Solo se aceptan imágenes JPG, PNG o WEBP.', 'warning');
            inputAvatar.value = '';
            return;
        }

        const maxBytes = 3 * 1024 * 1024; // 3MB
        if (file.size > maxBytes) {
            mostrarAlerta('La imagen supera el límite de 3MB. Por favor selecciona una imagen más ligera.', 'warning');
            inputAvatar.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Url = event.target.result;
            usuarioActual.fotoPerfil = base64Url;

            // Actualizar vista previa
            actualizarAvatarUI(usuarioActual.nombre, base64Url);

            // Persistir cambios
            sincronizarUsuarioEnBaseDeDatos(usuarioActual);
            mostrarAlerta('¡Fotografía de perfil actualizada con éxito!', 'success');
        };
        reader.readAsDataURL(file);
    });

    /**
     * Manejador del Formulario 1: Actualizar Datos Personales
     */
    formPerfil.addEventListener('submit', (e) => {
        e.preventDefault();
        alertContainer.innerHTML = '';

        const nombre = inputNombre.value.trim();
        const telefono = inputTelefono.value.trim();
        const ciudad = inputCiudad.value.trim();
        const direccion = inputDireccion.value.trim();

        // Validaciones de campos
        if (!nombre || !telefono || !ciudad || !direccion) {
            mostrarAlerta('Todos los campos marcados con asterisco (*) son obligatorios.', 'danger');
            return;
        }

        const regexTelefono = /^[0-9]{7,10}$/;
        if (!regexTelefono.test(telefono)) {
            mostrarAlerta('El número de teléfono debe contener entre 7 y 10 dígitos numéricos.', 'warning');
            return;
        }

        // Estado de carga en botón
        activarBotonCarga(btnGuardarDatos, btnGuardarText, btnGuardarSpinner, 'Guardando...');

        setTimeout(() => {
            // Actualizar objeto en memoria
            usuarioActual.nombre = nombre;
            usuarioActual.telefono = telefono;
            usuarioActual.ciudad = ciudad;
            usuarioActual.direccion = direccion;

            // Persistir
            sincronizarUsuarioEnBaseDeDatos(usuarioActual);
            renderizarDatosEnVista(usuarioActual);

            restaurarBotonCarga(btnGuardarDatos, btnGuardarText, btnGuardarSpinner, 'Guardar Datos');
            mostrarAlerta('¡Tus datos personales han sido actualizados exitosamente!', 'success');
        }, 600);
    });

    /**
     * =========================================================================
     * HISTORIA DE USUARIO 7: ACTUALIZACIÓN DE CORREO ELECTRÓNICO (HU-7)
     * =========================================================================
     * - QAS45HU-86: Solicitar confirmación con la contraseña actual.
     * - QAS45HU-90: Verificar que el nuevo correo no esté registrado / duplicado.
     * - QAS45HU-91: Actualizar el correo en las tablas correspondientes / almacenamiento.
     * - QAS45HU-93: Renovar la sesión del usuario con el nuevo correo.
     */
    if (formCorreo) {
        formCorreo.addEventListener('submit', (e) => {
            e.preventDefault();
            alertContainer.innerHTML = '';

            const nuevoCorreo = inputNuevoCorreo.value.trim().toLowerCase();
            const passwordConfirm = inputPassConfirmCorreo.value;

            // Validación de campos vacíos
            if (!nuevoCorreo || !passwordConfirm) {
                mostrarAlerta('Por favor completa el nuevo correo y tu contraseña actual para confirmar.', 'danger');
                return;
            }

            // Validación de formato de correo
            const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexCorreo.test(nuevoCorreo)) {
                mostrarAlerta('El formato del nuevo correo electrónico no es válido.', 'warning');
                return;
            }

            // Verificar si el correo es igual al actual
            if (nuevoCorreo === usuarioActual.correo.toLowerCase()) {
                mostrarAlerta('El nuevo correo no puede ser igual al correo que ya tienes registrado.', 'info');
                return;
            }

            // QAS45HU-86: Solicitar confirmación con la contraseña actual
            if (passwordConfirm !== usuarioActual.password) {
                mostrarAlerta('Contraseña incorrecta. Por seguridad, debes ingresar tu contraseña actual válida para autorizar el cambio de correo.', 'danger');
                return;
            }

            activarBotonCarga(btnCambiarCorreo, btnCorreoText, btnCorreoSpinner, 'Verificando...');

            setTimeout(() => {
                let clientes = JSON.parse(localStorage.getItem(STORAGE_KEY_CLIENTES)) || [];

                // QAS45HU-90: Verificar que el nuevo correo no esté registrado por otro usuario
                const correoDuplicado = clientes.some(c => 
                    c.correo && 
                    c.correo.toLowerCase() === nuevoCorreo && 
                    c.id !== usuarioActual.id
                );

                if (correoDuplicado) {
                    restaurarBotonCarga(btnCambiarCorreo, btnCorreoText, btnCorreoSpinner, 'Actualizar Correo');
                    mostrarAlerta('El correo electrónico ingresado ya se encuentra registrado por otra cuenta.', 'danger');
                    return;
                }

                // QAS45HU-91: Actualizar el correo en las tablas correspondientes / almacenamiento
                const correoAnterior = usuarioActual.correo;
                usuarioActual.correo = nuevoCorreo;

                const index = clientes.findIndex(c => 
                    (usuarioActual.id && c.id === usuarioActual.id) || 
                    (c.correo && c.correo.toLowerCase() === correoAnterior.toLowerCase())
                );

                if (index !== -1) {
                    clientes[index].correo = nuevoCorreo;
                } else {
                    clientes.push(usuarioActual);
                }
                localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));

                // QAS45HU-93: Renovar la sesión del usuario con el nuevo correo
                guardarSesionActiva(usuarioActual);

                // Actualizar interfaz visual
                renderizarDatosEnVista(usuarioActual);
                formCorreo.reset();

                restaurarBotonCarga(btnCambiarCorreo, btnCorreoText, btnCorreoSpinner, 'Actualizar Correo');
                mostrarAlerta(`¡Correo electrónico actualizado con éxito a "${nuevoCorreo}"! Tu sesión activa ha sido renovada.`, 'success');
            }, 600);
        });
    }

    /**
     * Manejador del Formulario 3: Cambio de Contraseña
     */
    formPassword.addEventListener('submit', (e) => {
        e.preventDefault();
        alertContainer.innerHTML = '';

        const passActual = inputPassActual.value;
        const passNuevo = inputPassNuevo.value;
        const passConfirm = inputPassConfirm.value;

        if (!passActual || !passNuevo || !passConfirm) {
            mostrarAlerta('Por favor completa todos los campos de contraseña.', 'danger');
            return;
        }

        // Validar contraseña actual contra la almacenada
        if (passActual !== usuarioActual.password) {
            mostrarAlerta('La contraseña actual ingresada es incorrecta.', 'danger');
            return;
        }

        if (passNuevo.length < 6) {
            mostrarAlerta('La nueva contraseña debe tener como mínimo 6 caracteres.', 'warning');
            return;
        }

        if (passNuevo !== passConfirm) {
            mostrarAlerta('La nueva contraseña y su confirmación no coinciden.', 'warning');
            return;
        }

        if (passNuevo === passActual) {
            mostrarAlerta('La nueva contraseña no puede ser idéntica a la anterior.', 'info');
            return;
        }

        activarBotonCarga(btnCambiarPass, btnPassText, btnPassSpinner, 'Actualizando...');

        setTimeout(() => {
            // Actualizar contraseña en el usuario
            usuarioActual.password = passNuevo;
            sincronizarUsuarioEnBaseDeDatos(usuarioActual);

            // Limpiar inputs de contraseña
            formPassword.reset();

            restaurarBotonCarga(btnCambiarPass, btnPassText, btnPassSpinner, 'Actualizar Contraseña');
            mostrarAlerta('¡Contraseña cambiada exitosamente! Tu cuenta ahora está protegida con la nueva clave.', 'success');
        }, 700);
    });

    /**
     * Actualiza el usuario dentro del arreglo 'db_clientes_tecni' y en la sesión activa
     */
    function sincronizarUsuarioEnBaseDeDatos(usuario) {
        let clientes = JSON.parse(localStorage.getItem(STORAGE_KEY_CLIENTES)) || [];
        const index = clientes.findIndex(c => (usuario.id && c.id === usuario.id) || (c.correo && c.correo.toLowerCase() === usuario.correo.toLowerCase()));

        if (index !== -1) {
            clientes[index] = { ...clientes[index], ...usuario };
        } else {
            clientes.push(usuario);
        }

        localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
        guardarSesionActiva(usuario);
    }

    /**
     * Guarda el usuario en sesión activa
     */
    function guardarSesionActiva(usuario) {
        localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(usuario));
        sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(usuario));
    }

    /**
     * Cierra la sesión activa y redirige al registro / login
     */
    function cerrarSesion() {
        localStorage.removeItem(STORAGE_KEY_SESION);
        sessionStorage.removeItem(STORAGE_KEY_SESION);
        mostrarAlerta('Sesión cerrada correctamente. Redirigiendo...', 'info');
        setTimeout(() => {
            window.location.href = 'register-client.html';
        }, 1200);
    }

    /**
     * Helper para mostrar alertas dinámicas de Bootstrap
     */
    function mostrarAlerta(mensaje, tipo = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show border-0 d-flex align-items-center gap-2 mb-4" 
                 style="border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);" role="alert">
                <i class="bi ${tipo === 'success' ? 'bi-check-circle-fill text-success fs-5' : (tipo === 'warning' ? 'bi-exclamation-triangle-fill text-warning fs-5' : 'bi-exclamation-circle-fill text-danger fs-5')}"></i>
                <div class="flex-grow-1">${mensaje}</div>
                <button type="button" class="btn-close shadow-none" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Utilidad para alternar entre ver u ocultar el texto de un input de contraseña
     */
    function configurarTogglePassword(btnId, inputId, iconId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);

        if (!btn || !input || !icon) return;

        btn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            }
        });
    }

    function activarBotonCarga(btn, textSpan, spinner, mensajeCarga) {
        btn.disabled = true;
        textSpan.textContent = mensajeCarga;
        spinner.classList.remove('d-none');
    }

    function restaurarBotonCarga(btn, textSpan, spinner, mensajeOriginal) {
        btn.disabled = false;
        textSpan.textContent = mensajeOriginal;
        spinner.classList.add('d-none');
    }

});
