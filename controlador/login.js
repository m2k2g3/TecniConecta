const script         = document.currentScript;
const raiz           = script ? new URL('../', script.src).href : '../';
const API            = script ? new URL('../model/auth.php', script.src).href : '../model/auth.php';
const form           = document.getElementById('formLogin');
const alertContainer = document.getElementById('alertContainer');
const btnSubmit      = document.getElementById('btnSubmit');
const btnText        = document.getElementById('btnText');
const btnSpinner     = document.getElementById('btnSpinner');

function mostrarError(texto) {
  alertContainer.innerHTML = '';
  const alerta = document.createElement('div');
  alerta.className = 'alert alert-danger py-2 small';
  alerta.setAttribute('role', 'alert');
  alerta.textContent = texto;
  alertContainer.appendChild(alerta);
}

function cargando(activo) {
  btnSubmit.disabled = activo;
  btnSpinner.classList.toggle('d-none', !activo);
  btnText.textContent = activo ? 'Ingresando...' : 'Ingresar';
}

document.getElementById('togglePassword').addEventListener('click', () => {
  const input  = document.getElementById('password');
  const icono  = document.getElementById('iconPassword');
  const oculta = input.type === 'password';
  input.type     = oculta ? 'text' : 'password';
  icono.className = oculta ? 'bi bi-eye' : 'bi bi-eye-slash';
});

(async () => {
  try {
    const d = await (await fetch(`${API}?accion=sesion`, { credentials: 'same-origin' })).json();
    if (d.ok && d.redirect) location.replace(raiz + d.redirect);
  } catch {}
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertContainer.innerHTML = '';
  cargando(true);
  try {
    const res = await fetch(`${API}?accion=login`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value, password: form.password.value }),
    });
    const data = await res.json();
    if (data.ok) {
      location.replace(raiz + data.redirect);
      return;
    }
    mostrarError(data.mensaje);
  } catch {
    mostrarError('No se pudo iniciar sesión. Revisa que Laragon esté encendido y la base de datos conectada');
  }
  cargando(false);
});
