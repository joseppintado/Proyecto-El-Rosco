document.addEventListener('DOMContentLoaded', () => {
    const btnToggle = document.getElementById('btnToggleForm');
    const formLogin = document.getElementById('formularioLogin');
    const formRegistro = document.getElementById('formularioRegistro');

    if (btnToggle && formLogin && formRegistro) {
        // Toggle entre formulario de login y registro
        btnToggle.addEventListener('click', () => {
            formLogin.classList.toggle('hidden');
            formRegistro.classList.toggle('hidden');

            btnToggle.textContent = formLogin.classList.contains('hidden')
                ? "¿Ya tienes cuenta? Inicia sesión"
                : "¿No tienes cuenta? Regístrate";
        });
    }

    if (formLogin) {
        // Envío del formulario de Login
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('loginUser').value;
            const pass = document.getElementById('loginPass').value;

            let parametros = `nombreUsuario=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
            realizarPeticion('POST', 'El Rosco/assets/php/login.php', parametros, function (respuesta) {
                if (respuesta.exito) {
                    if (respuesta.completo) {
                        // Pasamos de Pantalla 1 (Sesión) a Pantalla 2 (Configuración)
                        document.getElementById('seccionUsuarios').classList.add('hidden');
                        document.getElementById('configuracionJuego').classList.remove('hidden');
                        document.getElementById('contenedorJuego').classList.add('hidden');
                    } else {
                        // Limpiar formulario y pasar a Jugador 2
                        document.getElementById('loginUser').value = '';
                        document.getElementById('loginPass').value = '';
                        const title = document.getElementById('tituloLogin');
                        if (title) title.textContent = "Acceso al Juego - Jugador 2";
                        alert("Jugador 1 (" + respuesta.nombre + ") conectado con éxito. Ahora por favor inicie sesión el Jugador 2.");
                    }
                } else {
                    alert(respuesta.message || "Error al iniciar sesión");
                }
            });
        });
    }

    if (formRegistro) {
        // Envío del formulario de Registro con validaciones en cliente
        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('nombreUsuario').value;
            const pass = document.getElementById('password').value;
            const email = document.getElementById('email').value;
            const fechaNac = document.getElementById('fechaNacimiento').value;

            if (typeof Validador !== 'undefined') {
                if (Validador.estaVacio(user) || Validador.estaVacio(pass) || Validador.estaVacio(email) || Validador.estaVacio(fechaNac)) {
                    alert("Todos los campos son obligatorios.");
                    return;
                }
                if (!Validador.esPasswordSegura(pass)) {
                    alert("La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial.");
                    return;
                }
                if (!Validador.esEmailValido(email)) {
                    alert("El correo electrónico no es válido.");
                    return;
                }
            }

            let parametros = `nombreUsuario=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&email=${encodeURIComponent(email)}&fechaNacimiento=${encodeURIComponent(fechaNac)}`;
            realizarPeticion('POST', 'El Rosco/assets/php/registro.php', parametros, function (respuesta) {
                if (respuesta.exito) {
                    alert("registro exitoso, inicie secion");
                    formLogin.classList.remove('hidden');
                    formRegistro.classList.add('hidden');
                    btnToggle.textContent = "¿No tienes cuenta? Regístrate";
                } else {
                    alert(respuesta.message || "Error al registrarse");
                }
            });
        });
    }

    // Verificar si ya hay una sesión activa al cargar la página
    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', 'accion=verificarSesion', function (respuesta) {
        if (respuesta.exito) {
            // Si la sesión está activa, mostrar configuración directamente
            document.getElementById('seccionUsuarios').classList.add('hidden');
            document.getElementById('configuracionJuego').classList.remove('hidden');
        } else {
            // Si no está activa, forzar inicio de sesión correspondiente
            document.getElementById('seccionUsuarios').classList.remove('hidden');
            document.getElementById('configuracionJuego').classList.add('hidden');
            const title = document.getElementById('tituloLogin');
            if (respuesta.usuario_j1) {
                if (title) title.textContent = "Acceso al Juego - Jugador 2";
            } else {
                if (title) title.textContent = "Acceso al Juego - Jugador 1";
            }
        }
    });
});
