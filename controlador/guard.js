(() => {
  const script  = document.currentScript;
  const roles   = script.dataset.rol.split(',').map((r) => r.trim());
  const api     = new URL('auth.php', script.src).href;
  const raiz    = new URL('../', script.src).href;
  const login   = raiz + 'vistas/login.html';

  document.documentElement.style.visibility = 'hidden'; // evita ver el panel antes de validar

  fetch(`${api}?accion=sesion`, { credentials: 'same-origin' })
    .then((r) => r.json())
    .then((d) => {
      if (!d.ok) return location.replace(login);
      if (!roles.includes(d.usuario.rol)) return location.replace(raiz + d.redirect);
      window.usuarioActual = d.usuario; // { id, nombre, email, rol }
      document.documentElement.style.visibility = '';
    })
    .catch(() => location.replace(login));

  window.cerrarSesion = async () => {
    await fetch(`${api}?accion=logout`, { method: 'POST', credentials: 'same-origin' });
    location.replace(login);
  };
})();