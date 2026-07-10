// Asegura que el contenedor de toasts exista al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
});

/**
 * Muestra un mensaje estático inyectado en el HTML para respuestas del Servidor (PHP)
 * @param {string} mensaje - El texto del mensaje.
 * @param {string} tipo - El tipo de mensaje: 'success' o 'error'.
 * @param {string} seccion - La sección donde inyectarlo: 'usuarios', 'configuracion' o 'juego'.
 */
function mostrarMensajeServidor(mensaje, tipo, seccion) {
    let containerId = 'mensajeServidorUsuarios';
    if (seccion === 'configuracion') containerId = 'mensajeServidorConfiguracion';
    if (seccion === 'juego') containerId = 'mensajeServidorJuego';

    const container = document.getElementById(containerId);
    if (!container) return;

    // Limpiar mensajes previos en este contenedor
    container.innerHTML = '';

    if (!mensaje) return; // Si el mensaje está vacío, simplemente limpia el contenedor

    const icono = tipo === 'success' ? '✔' : '✖';

    const divMensaje = document.createElement('div');
    divMensaje.className = `mensaje-servidor ${tipo}`;
    divMensaje.innerHTML = `
        <span class="servidor-icon">${icono}</span>
        <div class="servidor-text">${mensaje}</div>
    `;

    container.appendChild(divMensaje);

    // Auto-limpieza después de 10 segundos para no saturar la UI
    if (container.dataset.timeoutId) {
        clearTimeout(parseInt(container.dataset.timeoutId));
    }
    const timeoutId = setTimeout(() => {
        divMensaje.style.opacity = '0';
        divMensaje.style.transform = 'translateY(-8px)';
        divMensaje.style.transition = 'all 0.4s ease';
        setTimeout(() => {
            if (divMensaje.parentNode === container) {
                container.removeChild(divMensaje);
            }
        }, 400);
    }, 10000);

    container.dataset.timeoutId = timeoutId;
}

/**
 * Muestra una notificación flotante (Toast) en pantalla manipulando el DOM y usando CSS
 * @param {string} mensaje - El texto de la notificación.
 * @param {string} tipo - El tipo: 'success', 'error', 'warning', 'info'.
 * @param {number} duracion - Duración en milisegundos (defecto 4500ms).
 */
function mostrarNotificacionCliente(mensaje, tipo = 'info', duracion = 4500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-cliente ${tipo}`;

    const iconos = {
        success: '✔',
        error: '✖',
        warning: '⚠',
        info: 'ℹ'
    };
    const icono = iconos[tipo] || 'ℹ';

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icono}</span>
            <span class="toast-message">${mensaje}</span>
        </div>
        <button class="toast-close-btn" aria-label="Cerrar">&times;</button>
    `;

    // Manejador para cerrar manualmente clickeando la cruz
    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => {
        cerrarToast(toast);
    });

    container.appendChild(toast);

    // Auto-cierre del toast
    const autoCierreTimeout = setTimeout(() => {
        cerrarToast(toast);
    }, duracion);

    // Guardamos el timeout en el elemento por si se cierra antes
    toast.dataset.timeoutId = autoCierreTimeout;
}

function cerrarToast(toast) {
    if (toast.dataset.timeoutId) {
        clearTimeout(parseInt(toast.dataset.timeoutId));
    }
    toast.classList.add('toast-descarga');
    toast.addEventListener('animationend', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

/**
 * Sobrescribe la función nativa window.alert() para capturar todas las alertas del juego
 * y redirigirlas a nuestro sistema de mensajería interactivo en pantalla.
 */
window.alert = function (mensaje) {
    console.log("[Alert Interceptado]:", mensaje);

    const msgLower = mensaje.toLowerCase();

    // 1. Clasificar y enrutar el mensaje según su contenido
    if (msgLower.includes('correcto')) {
        mostrarNotificacionCliente(mensaje, 'success', 3000);
    }
    else if (msgLower.includes('incorrecto') || msgLower.includes('la palabra correcta era')) {
        mostrarNotificacionCliente(mensaje, 'error', 5000);
    }
    else if (msgLower.includes('se acabó el tiempo') || msgLower.includes('tiempo agotado')) {
        mostrarNotificacionCliente(mensaje, 'warning', 6000);
    }
    else if (msgLower.includes('campos son obligatorios') || msgLower.includes('debe tener al menos') || msgLower.includes('no es válido')) {
        // Mensaje de validación local (Cliente)
        mostrarNotificacionCliente(mensaje, 'error', 5000);
    }
    else if (msgLower.includes('conectado con éxito') || msgLower.includes('registro exitoso')) {
        // Mensajes de respuesta de servidor exitosa
        // Para formularios de login/registro, usamos inyección HTML en el contenedor de usuarios
        mostrarMensajeServidor(mensaje, 'success', 'usuarios');
    }
    else if (msgLower.includes('error al iniciar sesión') || msgLower.includes('error al registrarse') || msgLower.includes('incorrectos')) {
        mostrarMensajeServidor(mensaje, 'error', 'usuarios');
    }
    else if (msgLower.includes('error al iniciar la partida') || msgLower.includes('error al salir')) {
        mostrarMensajeServidor(mensaje, 'error', 'configuracion');
    }
    else {
        // Fallback genérico a notificación flotante de información
        mostrarNotificacionCliente(mensaje, 'info', 4500);
    }
};

/**
 * Función para limpiar todos los mensajes del servidor activos
 */
function limpiarMensajesServidor() {
    ['mensajeServidorUsuarios', 'mensajeServidorConfiguracion', 'mensajeServidorJuego'].forEach(id => {
        const c = document.getElementById(id);
        if (c) c.innerHTML = '';
    });
}
