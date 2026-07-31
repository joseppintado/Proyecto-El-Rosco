// Aseguramos que el contenedor de notificaciones exista al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('contenedor-notificaciones')) {
        const container = document.createElement('div');
        container.id = 'contenedor-notificaciones';
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

    // Limpiamos mensajes previos en este contenedor
    container.innerHTML = '';

    if (!mensaje) return; // Si el mensaje está vacío, simplemente limpiamos el contenedor

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
 * Muestra una notificación flotante en pantalla manipulando el DOM y usando CSS
 * @param {string} mensaje - El texto de la notificación.
 * @param {string} tipo - El tipo: 'success', 'error', 'warning', 'info'.
 * @param {number} duracion - Duración (defecto 4500ms).
 */
function mostrarNotificacionCliente(mensaje, tipo = 'info', duracion = 4500) {
    let container = document.getElementById('contenedor-notificaciones');
    if (!container) {
        container = document.createElement('div');
        container.id = 'contenedor-notificaciones';
        document.body.appendChild(container);
    }

    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-cliente ${tipo}`;

    const iconos = {
        success: '✔',
        error: '✖',
        warning: '⚠',
        info: 'ℹ'
    };
    const icono = iconos[tipo] || 'ℹ';

    notificacion.innerHTML = `
        <div class="notificacion-contenido">
            <span class="notificacion-icono">${icono}</span>
            <span class="notificacion-mensaje">${mensaje}</span>
        </div>
        <button class="notificacion-boton-cerrar" aria-label="Cerrar">&times;</button>
    `;

    // Manejador para cerrar manualmente clickeando la cruz
    const closeBtn = notificacion.querySelector('.notificacion-boton-cerrar');
    closeBtn.addEventListener('click', () => {
        cerrarNotificacion(notificacion);
    });

    container.appendChild(notificacion);

    // Auto-cierre de la notif
    const autoCierreTimeout = setTimeout(() => {
        cerrarNotificacion(notificacion);
    }, duracion);

    // Guardamos el timeout en el elemento por si se cierra antes
    notificacion.dataset.timeoutId = autoCierreTimeout;
}

function cerrarNotificacion(notificacion) {
    if (notificacion.dataset.timeoutId) {
        clearTimeout(parseInt(notificacion.dataset.timeoutId));
    }
    notificacion.classList.add('notificacion-desvanecer');
    notificacion.addEventListener('animationend', () => {
        if (notificacion.parentNode) {
            notificacion.parentNode.removeChild(notificacion);
        }
    });
}

/**
 * Sobrescribimos la función nativa window.alert() para capturar todas las alertas del juego
 * y redirigirlas a nuestro sistema de mensajería en pantalla.
 */
window.alert = function (mensaje) {
    console.log("[Alert Interceptado]:", mensaje);

    const msgAlerta = mensaje.toLowerCase();

    // 1. Clasificamos y enrutamos el mensaje según su contenido
    if (msgAlerta.includes('correcto')) {
        mostrarNotificacionCliente(mensaje, 'success', 3000);
    }
    else if (msgAlerta.includes('incorrecto') || msgAlerta.includes('la palabra correcta era')) {
        mostrarNotificacionCliente(mensaje, 'error', 5000);
    }
    else if (msgAlerta.includes('se acabó el tiempo') || msgAlerta.includes('tiempo agotado')) {
        mostrarNotificacionCliente(mensaje, 'warning', 6000);
    }
    else if (msgAlerta.includes('campos son obligatorios') || msgAlerta.includes('debe tener al menos') || msgAlerta.includes('no es válido')) {
        // Mensaje de validación local (Cliente)
        mostrarNotificacionCliente(mensaje, 'error', 5000);
    }
    else if (msgAlerta.includes('conectado con éxito') || msgAlerta.includes('registro exitoso')) {
        // Mensajes de respuesta de servidor exitosa
        // Para formularios de login y registro, usamos inyección HTML en el contenedor de usuarios
        mostrarMensajeServidor(mensaje, 'success', 'usuarios');
    }
    else if (msgAlerta.includes('error al iniciar sesión') || msgAlerta.includes('error al registrarse') || msgAlerta.includes('incorrectos')) {
        mostrarMensajeServidor(mensaje, 'error', 'usuarios');
    }
    else if (msgAlerta.includes('error al iniciar la partida') || msgAlerta.includes('error al salir')) {
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
