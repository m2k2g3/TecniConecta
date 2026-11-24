(() => {
  const script  = document.currentScript;
  const roles   = script?.dataset?.rol ? script.dataset.rol.split(',').map((r) => r.trim().toLowerCase()) : [];
  const api     = new URL('../../backend/controllers/AuthController.php', script ? script.src : window.location.href).href;
  const raiz    = new URL('../../', script ? script.src : window.location.href).href;
  const login   = raiz + 'vistas/login.html';

  document.documentElement.style.visibility = 'hidden'; // Evita parpadeo antes de validar rol

  fetch(`${api}?accion=sesion`, { credentials: 'same-origin' })
    .then((r) => r.json())
    .then((d) => {
      if (!d.ok) return location.replace(login);
      if (roles.length > 0 && !roles.includes((d.usuario.rol || '').toLowerCase())) {
        return location.replace(raiz + d.redirect);
      }
      window.usuarioActual = d.usuario; // { id, nombre, email, rol }
      document.documentElement.style.visibility = '';
    })
    .catch(() => location.replace(login));

  window.cerrarSesion = async () => {
    try {
      await fetch(`${api}?accion=logout`, { method: 'POST', credentials: 'same-origin' });
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
    location.replace(login);
  };
})();
