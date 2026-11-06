document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const iconPassword = document.getElementById('iconPassword');

    togglePassword.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            iconPassword.classList.replace('bi-eye-slash', 'bi-eye');
        } else {
            passwordInput.type = 'password';
            iconPassword.classList.replace('bi-eye', 'bi-eye-slash');
        }
    });

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const iconConfirmPassword = document.getElementById('iconConfirmPassword');

    toggleConfirmPassword.addEventListener('click', () => {
        if (confirmPasswordInput.type === 'password') {
            confirmPasswordInput.type = 'text';
            iconConfirmPassword.classList.replace('bi-eye-slash', 'bi-eye');
        } else {
            confirmPasswordInput.type = 'password';
            iconConfirmPassword.classList.replace('bi-eye', 'bi-eye-slash');
        }
    });

    const formRegister = document.getElementById('formRegister');
    const alertContainer = document.getElementById('alertContainer');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    function mostrarAlerta(mensaje, tipo = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show border-0" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    formRegister.addEventListener('submit', (event) => {
        event.preventDefault();
        alertContainer.innerHTML = '';

        const nombre = document.getElementById('nombre').value.trim();
        const correo = document.getElementById('correo').value.trim().toLowerCase();
        const telefono = document.getElementById('telefono').value.trim();
        const ciudad = document.getElementById('ciudad').value.trim();
        const direccion = document.getElementById('direccion').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

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
        btnText.textContent = 'Verificando...';
        btnSpinner.classList.remove('d-none');

        setTimeout(() => {
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

            mostrarAlerta('Registro exitoso. Redirigiendo al inicio de sesión...', 'success');
            btnText.textContent = 'Completado';

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }, 1000);
    });
});