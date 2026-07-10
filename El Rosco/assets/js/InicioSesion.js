document.addEventListener('DOMContentLoaded', () => {
    const btnAlternar = document.getElementById('btnAlternarFormulario');
    const formularioInicioSesion = document.getElementById('formularioInicioSesion');
    const formRegistro = document.getElementById('formularioRegistro');

    if (btnAlternar && formularioInicioSesion && formRegistro) {
        // Toggle entre formulario de login y registro
        btnAlternar.addEventListener('click', () => {
            formularioInicioSesion.classList.toggle('oculto');
            formRegistro.classList.toggle('oculto');

            // Limpiar mensajes previos del servidor al alternar formularios
            limpiarMensajesServidor();

            btnAlternar.textContent = formularioInicioSesion.classList.contains('oculto')
                ? "¿Ya tienes cuenta? Inicia sesión"
                : "¿No tienes cuenta? Regístrate";
        });
    }

    if (formularioInicioSesion) {
        // Envío del formulario de Login
        formularioInicioSesion.addEventListener('submit', (e) => {
            e.preventDefault();
            limpiarMensajesServidor();
            const usuario = document.getElementById('usuarioInicioSesion').value;
            const clave = document.getElementById('claveInicioSesion').value;

            let parametros = `nombreUsuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(clave)}`;
            realizarPeticion('POST', 'El Rosco/assets/php/login.php', parametros, function (respuesta) {
                if (respuesta.exito) {
                    if (respuesta.completo) {
                        // Pasamos de Pantalla 1 (Sesión) a Pantalla 2 (Configuración)
                        document.getElementById('seccionUsuarios').classList.add('oculto');
                        document.getElementById('configuracionJuego').classList.remove('oculto');
                        document.getElementById('contenedorJuego').classList.add('oculto');
                    } else {
                        // Limpiar formulario y pasar a Jugador 2
                        document.getElementById('usuarioInicioSesion').value = '';
                        document.getElementById('claveInicioSesion').value = '';
                        const titulo = document.getElementById('tituloInicioSesion');
                        if (titulo) titulo.textContent = "Acceso al Juego - Jugador 2";
                        mostrarMensajeServidor("Jugador 1 (" + respuesta.nombre + ") conectado con éxito. Ahora por favor inicie sesión el Jugador 2.", "success", "usuarios");
                    }
                } else {
                    mostrarMensajeServidor(respuesta.mensaje || "Error al iniciar sesión", "error", "usuarios");
                }
            });
        });
    }

    if (formRegistro) {
        // Envío del formulario de Registro con validaciones en cliente
        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
            limpiarMensajesServidor();
            const usuario = document.getElementById('nombreUsuario').value;
            const clave = document.getElementById('contrasena').value;
            const correo = document.getElementById('correo').value;
            const fechaNacimiento = document.getElementById('fechaNacimiento').value;

            if (typeof Validador !== 'undefined') {
                if (Validador.estaVacio(usuario) || Validador.estaVacio(clave) || Validador.estaVacio(correo) || Validador.estaVacio(fechaNacimiento)) {
                    mostrarNotificacionCliente("Todos los campos son obligatorios.", "error");
                    return;
                }
                if (!Validador.esContrasenaSegura(clave)) {
                    mostrarNotificacionCliente("La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial.", "error");
                    return;
                }
                if (!Validador.esCorreoValido(correo)) {
                    mostrarNotificacionCliente("El correo electrónico no es válido.", "error");
                    return;
                }
            }

            let parametros = `nombreUsuario=${encodeURIComponent(usuario)}&contrasena=${encodeURIComponent(clave)}&correo=${encodeURIComponent(correo)}&fechaNacimiento=${encodeURIComponent(fechaNacimiento)}`;
            realizarPeticion('POST', 'El Rosco/assets/php/registro.php', parametros, function (respuesta) {
                if (respuesta.exito) {
                    mostrarMensajeServidor("registro exitoso, inicie secion", "success", "usuarios");
                    formularioInicioSesion.classList.remove('oculto');
                    formRegistro.classList.add('oculto');
                    btnAlternar.textContent = "¿No tienes cuenta? Regístrate";
                } else {
                    mostrarMensajeServidor(respuesta.mensaje || "Error al registrarse", "error", "usuarios");
                }
            });
        });
    }

    // Verificar si ya hay una sesión activa al cargar la página
    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', 'accion=verificarSesion', function (respuesta) {
        if (respuesta.exito) {
            // Si la sesión está activa, mostrar configuración directamente
            document.getElementById('seccionUsuarios').classList.add('oculto');
            document.getElementById('configuracionJuego').classList.remove('oculto');
        } else {
            // Si no está activa, forzar inicio de sesión correspondiente
            document.getElementById('seccionUsuarios').classList.remove('oculto');
            document.getElementById('configuracionJuego').classList.add('oculto');
            const titulo = document.getElementById('tituloInicioSesion');
            if (respuesta.usuario_j1) {
                if (titulo) titulo.textContent = "Acceso al Juego - Jugador 2";
            } else {
                if (titulo) titulo.textContent = "Acceso al Juego - Jugador 1";
            }
        }
    });
});
