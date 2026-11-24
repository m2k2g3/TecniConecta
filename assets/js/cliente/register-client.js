document.addEventListener('DOMContentLoaded', () => {
    const script = document.querySelector('script[src*="register-client.js"]');
    const API = script ? new URL('../../backend/controllers/AuthController.php', script.src).href : '../../backend/controllers/AuthController.php';

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const iconPassword = document.getElementById('iconPassword');

    if (togglePassword && passwordInput && iconPassword) {
        togglePassword.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                iconPassword.classList.replace('bi-eye-slash', 'bi-eye');
            } else {
                passwordInput.type = 'password';
                iconPassword.classList.replace('bi-eye', 'bi-eye-slash');
            }
        });
    }

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const iconConfirmPassword = document.getElementById('iconConfirmPassword');

    if (toggleConfirmPassword && confirmPasswordInput && iconConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', () => {
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                iconConfirmPassword.classList.replace('bi-eye-slash', 'bi-eye');
            } else {
                confirmPasswordInput.type = 'password';
                iconConfirmPassword.classList.replace('bi-eye', 'bi-eye-slash');
            }
        });
    }

    const formRegister = document.getElementById('formRegister');
    const alertContainer = document.getElementById('alertContainer');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    function mostrarAlerta(mensaje, tipo = 'danger') {
        if (!alertContainer) return;
        alertContainer.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show border-0" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    if (formRegister) {
        formRegister.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (alertContainer) alertContainer.innerHTML = '';

            const nombre = document.getElementById('nombre')?.value.trim() || '';
            const correo = document.getElementById('correo')?.value.trim().toLowerCase() || '';
            const telefono = document.getElementById('telefono')?.value.trim() || '';
            const ciudad = document.getElementById('ciudad')?.value.trim() || '';
            const direccion = document.getElementById('direccion')?.value.trim() || '';
            const password = document.getElementById('password')?.value || '';
            const confirmPassword = document.getElementById('confirmPassword')?.value || '';

            if (!nombre || !correo || !telefono || !ciudad || !direccion || !password || !confirmPassword) {
                mostrarAlerta('Por favor, completa todos los campos obligatorios.');
                return;
            }

            const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexCorreo.test(correo)) {
                mostrarAlerta('El formato del correo electrónico no es válido.');
                return;
            }

            const regexTelefono = /^[0-9]{7,10}$/;
            if (!regexTelefono.test(telefono)) {
                mostrarAlerta('El teléfono debe tener entre 7 y 10 dígitos numéricos.');
                return;
            }

            if (password.length < 6) {
                mostrarAlerta('La contraseña debe tener al menos 6 caracteres.');
                return;
            }

            if (password !== confirmPassword) {
                mostrarAlerta('Las contraseñas no coinciden.');
                return;
            }

            btnSubmit.disabled = true;
            btnText.textContent = 'Registrando...';
            btnSpinner.classList.remove('d-none');

            try {
                const res = await fetch(`${API}?accion=registro-cliente`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, correo, telefono, ciudad, direccion, password })
                });

                const data = await res.json();
                if (data.ok) {
                    const nuevoCliente = {
                        id: data.usuario?.id || Date.now(),
                        nombre: nombre,
                        correo: correo,
                        telefono: telefono,
                        ciudad: ciudad,
                        direccion: direccion,
                        rol: 'Cliente',
                        estado: 'Activo'
                    };
                    let usuarios = JSON.parse(localStorage.getItem('db_clientes_tecni')) || [];
                    usuarios.push(nuevoCliente);
                    localStorage.setItem('db_clientes_tecni', JSON.stringify(usuarios));
                    localStorage.setItem('usuario_activo', JSON.stringify(nuevoCliente));
                    sessionStorage.setItem('usuario_activo', JSON.stringify(nuevoCliente));

                    mostrarAlerta(data.mensaje || '¡Registro exitoso! Redirigiendo...', 'success');
                    btnText.textContent = 'Completado';
                    setTimeout(() => {
                        window.location.href = 'profile-client.html';
                    }, 1200);
                    return;
                } else {
                    mostrarAlerta(data.mensaje || 'Error al registrar.');
                }
            } catch (err) {
                console.warn('Servidor PHP no respondió, usando almacenamiento local:', err);
                let usuarios = JSON.parse(localStorage.getItem('db_clientes_tecni')) || [];
                const existe = usuarios.find(user => user.correo === correo);

                if (existe) {
                    mostrarAlerta('Este correo electrónico ya se encuentra registrado.');
                    btnSubmit.disabled = false;
                    btnText.textContent = 'Registrar Cuenta';
                    btnSpinner.classList.add('d-none');
                    return;
                }

                const nuevoCliente = {
                    id: Date.now(),
                    nombre: nombre,
                    correo: correo,
                    telefono: telefono,
                    ciudad: ciudad,
                    direccion: direccion,
                    password: password,
                    rol: 'Cliente',
                    estado: 'Activo',
                    fechaRegistro: new Date().toISOString()
                };

                usuarios.push(nuevoCliente);
                localStorage.setItem('db_clientes_tecni', JSON.stringify(usuarios));
                localStorage.setItem('usuario_activo', JSON.stringify(nuevoCliente));
                sessionStorage.setItem('usuario_activo', JSON.stringify(nuevoCliente));

                mostrarAlerta('¡Registro completado! Redirigiendo a tu perfil...', 'success');
                btnText.textContent = 'Completado';

                setTimeout(() => {
                    window.location.href = 'profile-client.html';
                }, 1200);
                return;
            }

            btnSubmit.disabled = false;
            btnText.textContent = 'Registrar Cuenta';
            btnSpinner.classList.add('d-none');
        });
    }
});
