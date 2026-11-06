let idPartidaActual = null;
let tiempoRestante = { 1: 150, 2: 150 };
let intervaloCronometro = null;
let turnoJugador = 1;
let aciertos = { 1: 0, 2: 0 };
let errores = { 1: 0, 2: 0 };
let palabrasContestadas = {
    1: Array(27).fill(false),
    2: Array(27).fill(false)
};
let palabrasJuego = [];
let indiceLetraActual = { 1: 0, 2: 0 };
let tiempoUsado = { 1: 0, 2: 0 };
let pantallaPreviaEstadisticas = null;
let nombreJ1 = "Jugador 1";
let nombreJ2 = "Jugador 2";
let partidaEnCurso = false; // para no finalizar dos veces la misma partida
let jugadorInicial = 1;
const abecedario = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');


document.addEventListener('DOMContentLoaded', () => {
    // Enlazamos botón de iniciar partida
    const btnIniciar = document.getElementById('btnIniciarPartida');
    if (btnIniciar) {
        btnIniciar.addEventListener('click', iniciarNuevaPartida);
    }

    const btnAbandonar = document.getElementById('btnAbandonar');
    if (btnAbandonar) {
        btnAbandonar.addEventListener('click', () => {
            const modal = document.getElementById('modalConfirmacion');
            if (modal) {
                modal.classList.remove('oculto');
            }
        });
    }

    const btnConfirmarAbandonar = document.getElementById('btnConfirmarAbandonar');
    if (btnConfirmarAbandonar) {
        btnConfirmarAbandonar.addEventListener('click', () => {
            const modal = document.getElementById('modalConfirmacion');
            if (modal) modal.classList.add('oculto');
            abandonarPartida();
        });
    }

    // Enlazamos botones de guardar partida
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            document.getElementById('modalGuardar').classList.remove('oculto');
        });
    }

    const btnConfirmarGuardar = document.getElementById('btnConfirmarGuardar');
    if (btnConfirmarGuardar) {
        btnConfirmarGuardar.addEventListener('click', () => {
            document.getElementById('modalGuardar').classList.add('oculto');
            guardarPartida();
        });
    }

    const btnCancelarGuardar = document.getElementById('btnCancelarGuardar');
    if (btnCancelarGuardar) {
        btnCancelarGuardar.addEventListener('click', () => {
            document.getElementById('modalGuardar').classList.add('oculto');
        });
    }

    const btnCancelarAbandonar = document.getElementById('btnCancelarAbandonar');
    if (btnCancelarAbandonar) {
        btnCancelarAbandonar.addEventListener('click', () => {
            const modal = document.getElementById('modalConfirmacion');
            if (modal) modal.classList.add('oculto');
        });
    }

    // Enlazamos botones de estadísticas generales
    const btnEstadisticas = document.getElementById('btnVerEstadisticasGenerales');
    if (btnEstadisticas) {
        btnEstadisticas.addEventListener('click', () => {
            let seccionEstadisticas = document.getElementById('seccionEstadisticasGenerales');
            if (seccionEstadisticas && !seccionEstadisticas.classList.contains('oculto')) {
                return; // Si ya está visible, no hacemos nada para evitar sobreescribir la pantalla
            }

            // Encontramos cuál es la pantalla visible antes de ocultar (solo si pantallaPreviaEstadisticas no está ya establecida)
            if (!pantallaPreviaEstadisticas) {
                let seccionUsuarios = document.getElementById('seccionUsuarios');
                let seccionConfiguracion = document.getElementById('configuracionJuego');
                let seccionJuego = document.getElementById('contenedorJuego');

                if (!seccionUsuarios.classList.contains('oculto')) {
                    pantallaPreviaEstadisticas = 'seccionUsuarios';
                } else if (!seccionConfiguracion.classList.contains('oculto')) {
                    pantallaPreviaEstadisticas = 'configuracionJuego';
                } else if (!seccionJuego.classList.contains('oculto')) {
                    pantallaPreviaEstadisticas = 'contenedorJuego';
                } else {
                    pantallaPreviaEstadisticas = 'seccionUsuarios';
                }
            }

            document.getElementById('seccionUsuarios').classList.add('oculto');
            document.getElementById('configuracionJuego').classList.add('oculto');
            document.getElementById('contenedorJuego').classList.add('oculto');

            // Mostrar pantalla de estadísticas generales
            seccionEstadisticas.classList.remove('oculto');
            cargarEstadisticasGenerales();
        });
    }

    const btnVolverJuegoEstadisticas = document.getElementById('btnVolverAlJuegoDesdeEstadisticas');
    if (btnVolverJuegoEstadisticas) {
        btnVolverJuegoEstadisticas.addEventListener('click', () => {
            document.getElementById('seccionEstadisticasGenerales').classList.add('oculto');
            if (pantallaPreviaEstadisticas) {
                document.getElementById(pantallaPreviaEstadisticas).classList.remove('oculto');
                if (pantallaPreviaEstadisticas === 'configuracionJuego') {
                    cargarPartidasGuardadas();
                }
                pantallaPreviaEstadisticas = null; // Restablecemos para la próxima vez
            } else {
                document.getElementById('seccionUsuarios').classList.remove('oculto');
            }
        });
    }

    // Cargamos el historial inicial
    cargarHistorialPartidas();

    const btnSalirConfiguracion = document.getElementById('btnSalirJuegoConfiguracion');
    if (btnSalirConfiguracion) {
        btnSalirConfiguracion.addEventListener('click', () => {
            const modal = document.getElementById('modalSalirJuego');
            if (modal) {
                modal.classList.remove('oculto');
            }
        });
    }

    const btnConfirmarSalir = document.getElementById('btnConfirmarSalir');
    if (btnConfirmarSalir) {
        btnConfirmarSalir.addEventListener('click', () => {
            const modal = document.getElementById('modalSalirJuego');
            if (modal) modal.classList.add('oculto');
            salirDelJuego();
        });
    }

    const btnCancelarSalir = document.getElementById('btnCancelarSalir');
    if (btnCancelarSalir) {
        btnCancelarSalir.addEventListener('click', () => {
            const modal = document.getElementById('modalSalirJuego');
            if (modal) modal.classList.add('oculto');
        });
    }
});

function salirDelJuego() {
    limpiarMensajesServidor();
    realizarPeticion('POST', 'El Rosco/assets/php/logout.php', '', function (respuesta) {
        if (respuesta.exito) {
            // Limpiamos campos de login
            let usuarioInicioSesion = document.getElementById('usuarioInicioSesion');
            let claveInicioSesion = document.getElementById('claveInicioSesion');
            if (usuarioInicioSesion) usuarioInicioSesion.value = '';
            if (claveInicioSesion) claveInicioSesion.value = '';

            // Ocultamos pantallas y mostramos login
            document.getElementById('contenedorJuego').classList.add('oculto');
            document.getElementById('configuracionJuego').classList.add('oculto');
            document.getElementById('seccionUsuarios').classList.remove('oculto');
            document.getElementById('zonaDefinicion').innerHTML = "";
        } else {
            mostrarMensajeServidor("Error al salir del juego.", "error", "configuracion");
        }
    });
}

// estadoGuardado es null en una partida nueva o el estado de la partida guardada al continuar
function cargarPalabrasDelRosco(estadoGuardado = null) {

    // las palabras ya las eligió el servidor, solo llegan la definición y la cantidad de letras
    realizarPeticion('GET', 'El Rosco/assets/php/obtener_palabras.php', 't=' + new Date().getTime(), function (respuesta) {
        if (respuesta.exito && respuesta.palabras.length === 54) {
            iniciarTablero(respuesta.palabras, estadoGuardado);
        } else {
            mostrarMensajeServidor(respuesta.mensaje || "Error al cargar las palabras del juego.", "error", "juego");
        }
    });
}

function iniciarNuevaPartida() {
    limpiarMensajesServidor();
    let nivel = document.getElementById('selectorNivel').value;
    let duracion = document.getElementById('selectorTiempo').value;
    let ayuda = document.getElementById('selectorAyuda').value;
    let parametros = `accion=iniciarPartida&nivel=${encodeURIComponent(nivel)}&duracion=${encodeURIComponent(duracion)}&ayuda=${encodeURIComponent(ayuda)}`;

    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', parametros, function (respuesta) {
        if (respuesta.exito) {
            idPartidaActual = respuesta.idPartida;

            // Almacenamos nombres de jugadores y turno inicial
            nombreJ1 = respuesta.nombreJ1 || "Jugador 1";
            nombreJ2 = respuesta.nombreJ2 || "Jugador 2";
            turnoJugador = respuesta.jugadorInicial || 1;
            jugadorInicial = turnoJugador;

            // Actualizamos etiquetas en la UI
            let etiquetaJ1 = document.getElementById('etiqueta-jugador1');
            let etiquetaJ2 = document.getElementById('etiqueta-jugador2');
            if (etiquetaJ1) etiquetaJ1.textContent = nombreJ1;
            if (etiquetaJ2) etiquetaJ2.textContent = nombreJ2;

            // Ocultamos la Pantalla 2 (Configuración) y mostramos Pantalla 3 (Juego Activo)
            document.getElementById('configuracionJuego').classList.add('oculto');
            document.getElementById('contenedorJuego').classList.remove('oculto');

            cargarPalabrasDelRosco();
        } else {
            mostrarMensajeServidor("Error al iniciar la partida: " + respuesta.mensaje, "error", "configuracion");
        }
    });
}

function iniciarTablero(listaPalabras, estadoGuardado = null) {
    palabrasJuego = listaPalabras;
    aciertos = { 1: 0, 2: 0 };
    errores = { 1: 0, 2: 0 };
    palabrasContestadas = {
        1: Array(27).fill(false),
        2: Array(27).fill(false)
    };
    indiceLetraActual = { 1: 0, 2: 0 };
    tiempoUsado = { 1: 0, 2: 0 };
    partidaEnCurso = true;

    let selectorTiempo = document.getElementById('selectorTiempo');
    let segundosConfigurados = selectorTiempo ? parseInt(selectorTiempo.value) : 120;
    tiempoRestante = { 1: segundosConfigurados, 2: segundosConfigurados };

    // Mostramos los botones de abandonar y guardar
    document.getElementById('btnAbandonar').classList.remove('oculto');
    document.getElementById('btnGuardar').classList.remove('oculto');

    // Cargamos características en la Zona General
    let selectorNivel = document.getElementById('selectorNivel');
    let selectorAyuda = document.getElementById('selectorAyuda');

    let textoNivel = selectorNivel ? selectorNivel.value.toUpperCase() : "MEDIA";
    let textoTiempo = segundosConfigurados === 0 ? "Sin límite" : `${segundosConfigurados}s`;
    let textoAyuda = selectorAyuda ? (selectorAyuda.value === 'si' ? "Habilitada" : "Inhabilitada") : "Habilitada";

    document.getElementById('generalDificultad').textContent = textoNivel;
    document.getElementById('generalDuracion').textContent = textoTiempo;
    document.getElementById('generalAyuda').textContent = textoAyuda;

    // Cargar historial de partidas
    cargarHistorialPartidas();

    // Cargar jugador inicial definido en el servidor
    let nombreInicial = (jugadorInicial === 1) ? nombreJ1 : nombreJ2;
    document.getElementById('generalJugadorInicial').textContent = nombreInicial;

    // Actualizamos marcadores en el DOM
    document.getElementById('aciertos-j1').textContent = '0';
    document.getElementById('errores-j1').textContent = '0';
    document.getElementById('aciertos-j2').textContent = '0';
    document.getElementById('errores-j2').textContent = '0';

    let zonaJ1 = document.getElementById('zona-jugador1');
    let zonaJ2 = document.getElementById('zona-jugador2');
    zonaJ1.innerHTML = "";
    zonaJ2.innerHTML = "";

    // Renderizamos rosco del Jugador 1
    abecedario.forEach((letra, indice) => {
        let botonLetra = document.createElement('button');
        botonLetra.textContent = letra;
        botonLetra.classList.add("btn-letra");
        botonLetra.classList.add(`pos-1-${indice}`);
        zonaJ1.appendChild(botonLetra);
    });

    // Renderizamos rosco del Jugador 2
    abecedario.forEach((letra, indice) => {
        let botonLetra = document.createElement('button');
        botonLetra.textContent = letra;
        botonLetra.classList.add("btn-letra");
        botonLetra.classList.add(`pos-2-${indice}`);
        zonaJ2.appendChild(botonLetra);
    });

    // si estamos continuando una partida guardada, dejamos el tablero como quedó
    if (estadoGuardado !== null) {
        restaurarEstado(estadoGuardado, segundosConfigurados);
    }

    actualizarVisualTurno();
    iniciarCronometro();
    presentarDefinicionActiva();
}

// restauramos el estado guardado: letras, contadores, letra actual, tiempos y turno
function restaurarEstado(estado, segundosConfigurados) {
    [1, 2].forEach(numJugador => {
        let datos = estado.jugadores[numJugador];

        datos.letras.forEach(letra => {
            palabrasContestadas[numJugador][letra.indice] = true;
            let boton = document.querySelector(`.pos-${numJugador}-${letra.indice}`);
            if (letra.es_correcta) {
                aciertos[numJugador]++;
                if (boton) boton.classList.add('acierto');
            } else {
                errores[numJugador]++;
                if (boton) boton.classList.add('error');
            }
        });

        document.getElementById(`aciertos-j${numJugador}`).textContent = aciertos[numJugador];
        document.getElementById(`errores-j${numJugador}`).textContent = errores[numJugador];

        indiceLetraActual[numJugador] = datos.indice;
        tiempoUsado[numJugador] = datos.tiempo_usado;
        if (segundosConfigurados > 0) {
            tiempoRestante[numJugador] = Math.max(0, segundosConfigurados - datos.tiempo_usado);
        }
    });

    turnoJugador = estado.turno;
}

function presentarDefinicionActiva() {
    // Limpiamos el resaltado previo de cualquier letra activa
    document.querySelectorAll('.btn-letra').forEach(b => b.classList.remove('letra-activa'));

    // Si el jugador de este turno no tiene tiempo, no puede jugar
    let selectorTiempo = document.getElementById('selectorTiempo');
    let segundosConfigurados = selectorTiempo ? parseInt(selectorTiempo.value) : 120;

    let tiempoAgotadoJ1 = (segundosConfigurados > 0 && tiempoRestante[1] <= 0);
    let tiempoAgotadoJ2 = (segundosConfigurados > 0 && tiempoRestante[2] <= 0);

    let completoJ1 = palabrasContestadas[1].every(val => val === true) || tiempoAgotadoJ1;
    let completoJ2 = palabrasContestadas[2].every(val => val === true) || tiempoAgotadoJ2;

    if (completoJ1 && completoJ2) {
        finalizarPartida();
        return;
    }

    // Si el turno actual está finalizado, cambiamos al otro
    if (turnoJugador === 1 && completoJ1) {
        turnoJugador = 2;
        actualizarVisualTurno();
        presentarDefinicionActiva();
        return;
    }
    if (turnoJugador === 2 && completoJ2) {
        turnoJugador = 1;
        actualizarVisualTurno();
        presentarDefinicionActiva();
        return;
    }

    // Verificamos si el jugador del turno tiene letras pendientes, de lo contrario buscamos en forma circular
    let indice = indiceLetraActual[turnoJugador];
    let encontrado = false;
    for (let i = 0; i < 27; i++) {
        let indiceComprobar = (indice + i) % 27;
        if (!palabrasContestadas[turnoJugador][indiceComprobar]) {
            indiceLetraActual[turnoJugador] = indiceComprobar;
            encontrado = true;
            break;
        }
    }

    if (!encontrado) {
        let otroJugador = (turnoJugador === 1) ? 2 : 1;
        turnoJugador = otroJugador;
        actualizarVisualTurno();
        presentarDefinicionActiva();
        return;
    }

    // Resaltar la letra activa actual
    let indiceActivo = indiceLetraActual[turnoJugador];
    let botonActivo = document.querySelector(`.pos-${turnoJugador}-${indiceActivo}`);
    if (botonActivo) {
        botonActivo.classList.add('letra-activa');
    }

    // Cargar la definición en la targeta de def
    let desplazamiento = (turnoJugador === 1) ? 0 : 27;
    let palabra = palabrasJuego[indiceActivo + desplazamiento];

    mostrarDefinicion(palabra, indiceActivo, turnoJugador);
}

function cederTurno() {
    let indiceActivo = indiceLetraActual[turnoJugador];
    let botonActivo = document.querySelector(`.pos-${turnoJugador}-${indiceActivo}`);
    if (botonActivo) {
        botonActivo.classList.remove('letra-activa');
    }

    // Cambiamos de turno si el otro jugador tiene letras pendientes
    let siguienteJugador = (turnoJugador === 1) ? 2 : 1;

    let selectorTiempo = document.getElementById('selectorTiempo');
    let segundosConfigurados = selectorTiempo ? parseInt(selectorTiempo.value) : 120;
    let tiempoAgotadoSiguiente = (segundosConfigurados > 0 && tiempoRestante[siguienteJugador] <= 0);
    let siguienteFinalizado = palabrasContestadas[siguienteJugador].every(val => val === true) || tiempoAgotadoSiguiente;

    if (!siguienteFinalizado) {
        turnoJugador = siguienteJugador;
    }

    actualizarVisualTurno();
    presentarDefinicionActiva();
}

function actualizarVisualTurno() {
    let panelJ1 = document.getElementById('recuadro-jugador1');
    let panelJ2 = document.getElementById('recuadro-jugador2');
    let nombreActivo = document.getElementById('nombreJugadorActivo');

    if (turnoJugador === 1) {
        panelJ1.classList.add('jugador-activo');
        panelJ2.classList.remove('jugador-activo');
        nombreActivo.textContent = nombreJ1;
        nombreActivo.className = "nombre-jugador-1";
    } else {
        panelJ2.classList.add('jugador-activo');
        panelJ1.classList.remove('jugador-activo');
        nombreActivo.textContent = nombreJ2;
        nombreActivo.className = "nombre-jugador-2";
    }
}

function mostrarDefinicion(palabra, indiceRelativo, numJugador) {
    if (numJugador !== turnoJugador) {
        return;
    }

    let zonaDefinicion = document.getElementById('zonaDefinicion');

    let selectorAyuda = document.getElementById('selectorAyuda');
    let ayudaHabilitada = selectorAyuda ? selectorAyuda.value === 'si' : true;
    let htmlAyuda = ayudaHabilitada
        ? `<div class="ayuda-letras">Cantidad de letras: ${palabra.cantidad_letras}</div>`
        : ``;

    zonaDefinicion.innerHTML = `
        <div class="tarjeta-definicion">
            <h4 class="letra-indicador">Jugando letra: <span class="letra-resaltada">${abecedario[indiceRelativo]}</span></h4>
            <p><strong>Definición:</strong> ${palabra.definicion}</p>
            ${htmlAyuda}
            <input type="text" id="campoRespuesta" placeholder="Tu respuesta..." autocomplete="off">
            <div class="definicion-acciones">
                <button id="btnEnviarRespuesta" class="btn-confirmar">Confirmar</button>
                <button id="btnCederTurno" class="btn-ceder">Ceder Turno</button>
            </div>
        </div>
    `;

    const campoRespuesta = document.getElementById('campoRespuesta');
    campoRespuesta.focus();

    // Confirmar respuesta con botón
    document.getElementById('btnEnviarRespuesta').onclick = function () {
        let respuesta = campoRespuesta.value;
        enviarRespuesta(respuesta, indiceRelativo, numJugador);
    };

    // Ceder turno con botón
    document.getElementById('btnCederTurno').onclick = function () {
        cederTurno();
    };

    // Confirmación de respuesta con tecla Enter
    campoRespuesta.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            let respuesta = campoRespuesta.value;
            enviarRespuesta(respuesta, indiceRelativo, numJugador);
        }
    });
}

function enviarRespuesta(respuesta, indiceRelativo, numJugador) {
    // mandamos solo jugador y letra, la palabra la busca el servidor
    let parametros = `accion=verificar&jugador=${numJugador}&indice=${indiceRelativo}&respuesta_usuario=${encodeURIComponent(respuesta)}`;

    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', parametros, function (resultado) {
        if (resultado.exito) {
            let datos = resultado.datos;
            palabrasContestadas[numJugador][indiceRelativo] = true;

            let boton = document.querySelector(`.pos-${numJugador}-${indiceRelativo}`);
            if (boton) {
                boton.classList.remove('letra-activa');
            }

            let selectorTiempo = document.getElementById('selectorTiempo');
            let segundosConfigurados = selectorTiempo ? parseInt(selectorTiempo.value) : 120;

            if (datos.es_correcta) {
                if (boton) boton.classList.add("acierto");
                aciertos[numJugador]++;
                document.getElementById(`aciertos-j${numJugador}`).textContent = aciertos[numJugador];

                mostrarNotificacionCliente("Letra " + abecedario[indiceRelativo].toUpperCase() + ": Correcto", "success", 2000);

                // Mantiene el turno, avanza al siguiente del mismo jugador
                indiceLetraActual[numJugador] = (indiceLetraActual[numJugador] + 1) % 27;
            } else {
                if (boton) boton.classList.add("error");
                errores[numJugador]++;
                document.getElementById(`errores-j${numJugador}`).textContent = errores[numJugador];

                mostrarNotificacionCliente("Letra " + abecedario[indiceRelativo].toUpperCase() + ": Incorrecto. La palabra correcta era: " + datos.palabra_correcta, "error", 5000);

                // Pierde el turno y avanza a la siguiente letra
                indiceLetraActual[numJugador] = (indiceLetraActual[numJugador] + 1) % 27;

                // Alternar turno al otro jugador si no ha finalizado
                let siguienteJugador = (numJugador === 1) ? 2 : 1;
                let tiempoAgotadoSiguiente = (segundosConfigurados > 0 && tiempoRestante[siguienteJugador] <= 0);
                let siguienteFinalizado = palabrasContestadas[siguienteJugador].every(val => val === true) || tiempoAgotadoSiguiente;
                if (!siguienteFinalizado) {
                    turnoJugador = siguienteJugador;
                }
            }

            document.getElementById("zonaDefinicion").innerHTML = "";

            actualizarVisualTurno();
            presentarDefinicionActiva();
        } else {
            mostrarNotificacionCliente("Error: " + resultado.mensaje, "error", 4000);
        }
    });
}

// mandamos el estado actual de la partida para guardarla
function guardarPartida() {
    if (!partidaEnCurso) return;

    // Pausamos el cronómetro mientras se guarda
    clearInterval(intervaloCronometro);

    let parametros = `accion=guardarPartida&turno=${turnoJugador}` +
        `&indice_j1=${indiceLetraActual[1]}&indice_j2=${indiceLetraActual[2]}` +
        `&tiempo_j1=${tiempoUsado[1]}&tiempo_j2=${tiempoUsado[2]}`;

    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', parametros, function (respuesta) {
        if (respuesta.exito) {
            partidaEnCurso = false;
            document.getElementById('zonaDefinicion').innerHTML = "";
            document.getElementById('recuadro-jugador1').classList.remove('jugador-activo');
            document.getElementById('recuadro-jugador2').classList.remove('jugador-activo');

            // Volvemos a la pantalla de configuración
            document.getElementById('contenedorJuego').classList.add('oculto');
            document.getElementById('configuracionJuego').classList.remove('oculto');
            mostrarMensajeServidor("Partida guardada. Pueden retomarla hasta el " + respuesta.fechaLimite + ".", "success", "configuracion");
            cargarPartidasGuardadas();
        } else {
            // si no se pudo guardar seguimos jugando
            mostrarNotificacionCliente("Error al guardar la partida: " + respuesta.mensaje, "error", 5000);
            iniciarCronometro();
        }
    });
}

function abandonarPartida() {
    // abandona el jugador que tiene el turno
    finalizarPartida('abandono', turnoJugador);
}

// motivo puede ser 'completo', 'tiempo' o 'abandono', si no viene lo deducimos
// el ganador lo calcula el servidor, acá solo armamos el mensaje
function finalizarPartida(motivo = null, abandona = 0) {
    if (!partidaEnCurso) return;
    partidaEnCurso = false;

    clearInterval(intervaloCronometro);

    // Ocultamos los botones de abandonar y guardar al finalizar
    document.getElementById('btnAbandonar').classList.add('oculto');
    document.getElementById('btnGuardar').classList.add('oculto');

    document.querySelectorAll('.btn-letra').forEach(b => {
        b.onclick = null;
    });
    document.getElementById('recuadro-jugador1').classList.remove('jugador-activo');
    document.getElementById('recuadro-jugador2').classList.remove('jugador-activo');

    if (motivo === null) {
        let selectorTiempo = document.getElementById('selectorTiempo');
        let segundosConfigurados = selectorTiempo ? parseInt(selectorTiempo.value) : 120;
        let algunoSinTiempo = segundosConfigurados > 0 && (tiempoRestante[1] <= 0 || tiempoRestante[2] <= 0);
        motivo = algunoSinTiempo ? 'tiempo' : 'completo';
    }

    let parametros = `accion=finalizarPartida&motivo=${motivo}&abandona=${abandona}&tiempo_j1=${tiempoUsado[1]}&tiempo_j2=${tiempoUsado[2]}`;
    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', parametros, function (respuesta) {
        if (respuesta.exito) {
            let mensajeFinal = armarMensajeFinal(respuesta.motivo, respuesta.datos);
            mostrarNotificacionCliente(mensajeFinal, "info", 6000);
            mostrarTarjetaFinal(mensajeFinal);
        } else {
            mostrarTarjetaFinal("No se pudo registrar el resultado de la partida: " + respuesta.mensaje);
        }
        cargarHistorialPartidas();
    });
}

function armarMensajeFinal(motivo, datos) {
    let g = datos.ganador;
    let p = (g === 1) ? 2 : 1;
    let nombres = { 1: nombreJ1, 2: nombreJ2 };
    let mensaje = "";

    switch (datos.criterio) {
        case 'abandono':
            mensaje = `${nombres[p]} abandonó la partida. Ganó ${nombres[g]}.`;
            break;
        case 'aciertos':
            mensaje = `Ganó ${nombres[g]} con ${datos.aciertos[g]} aciertos (contra ${datos.aciertos[p]}).`;
            break;
        case 'tiempo':
            mensaje = `Empate en ${datos.aciertos[g]} aciertos. Ganó ${nombres[g]} por usar menos tiempo (${datos.tiempos[g]}s contra ${datos.tiempos[p]}s).`;
            break;
        case 'errores':
            mensaje = `Empate en aciertos y en tiempo. Ganó ${nombres[g]} por tener menos errores (${datos.errores[g]} contra ${datos.errores[p]}).`;
            break;
        default:
            mensaje = `Empate total en aciertos, tiempo y errores. Ganó ${nombres[g]} por sorteo.`;
    }

    let prefijo = (motivo === 'tiempo') ? "¡Tiempo agotado! " : "";
    return prefijo + "¡Fin de la partida! " + mensaje;
}

function mostrarTarjetaFinal(mensajeFinal) {
    document.getElementById('zonaDefinicion').innerHTML = `
        <div class="tarjeta-definicion tarjeta-finalizada">
            <h3>Partida Finalizada</h3>
            <p>${mensajeFinal}</p>
            <div class="definicion-acciones">
                <button id="btnVolverAConfiguracion" class="btn-ayuda btn-volver-configuracion">Jugar otra partida</button>
                <button id="btnSalirJuegoFin" class="btn-abandonar btn-cerrar-final">Cerrar sesión</button>
            </div>
        </div>
    `;

    document.getElementById('btnVolverAConfiguracion').onclick = function () {
        document.getElementById('contenedorJuego').classList.add('oculto');
        document.getElementById('configuracionJuego').classList.remove('oculto');
        document.getElementById('zonaDefinicion').innerHTML = "";
        cargarPartidasGuardadas();
    };

    document.getElementById('btnSalirJuegoFin').onclick = function () {
        const modal = document.getElementById('modalSalirJuego');
        if (modal) {
            modal.classList.remove('oculto');
        }
    };
}

// pedimos las partidas guardadas de los dos jugadores y las mostramos en la configuración
function cargarPartidasGuardadas() {
    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', 'accion=obtenerPartidasGuardadas', function (respuesta) {
        let seccion = document.getElementById('seccionPartidasGuardadas');
        let lista = document.getElementById('listaPartidasGuardadas');

        if (!respuesta.exito || respuesta.partidas.length === 0) {
            // si no hay partidas guardadas ocultamos la sección
            seccion.classList.add('oculto');
            lista.innerHTML = "";
            return;
        }

        let html = "";
        respuesta.partidas.forEach(p => {
            let textoDuracion = (p.duracion === 0) ? "Sin límite" : (p.duracion / 60) + " min";
            let textoAyuda = (p.ayuda === 1) ? "con ayuda" : "sin ayuda";
            html += `<div class="partida-guardada">
                <div>
                    <strong>Partida #${p.id_juego}</strong> (${p.nivel.toUpperCase()}, ${textoDuracion}, ${textoAyuda})<br>
                    Aciertos: ${respuesta.nombreJ1} ${p.aciertos_j1} - ${p.aciertos_j2} ${respuesta.nombreJ2}<br>
                    Guardada: ${p.fecha_guardado} · Vence: ${p.fecha_vencimiento}
                </div>
                <button class="btn-continuar" data-id="${p.id_juego}">Continuar</button>
            </div>`;
        });
        lista.innerHTML = html;
        seccion.classList.remove('oculto');

        // Enlazamos cada botón Continuar con su partida
        lista.querySelectorAll('.btn-continuar').forEach(boton => {
            boton.addEventListener('click', () => {
                continuarPartida(parseInt(boton.dataset.id));
            });
        });
    });
}

// continuamos una partida guardada, el servidor la arma y nos devuelve su estado
function continuarPartida(idJuego) {
    limpiarMensajesServidor();
    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', 'accion=continuarPartida&id_juego=' + idJuego, function (respuesta) {
        if (!respuesta.exito) {
            mostrarMensajeServidor(respuesta.mensaje, "error", "configuracion");
            cargarPartidasGuardadas(); // por si venció, actualizamos la lista
            return;
        }

        idPartidaActual = respuesta.idPartida;
        nombreJ1 = respuesta.nombreJ1;
        nombreJ2 = respuesta.nombreJ2;
        jugadorInicial = respuesta.jugadorInicial;
        document.getElementById('etiqueta-jugador1').textContent = nombreJ1;
        document.getElementById('etiqueta-jugador2').textContent = nombreJ2;

        // cargamos las características de la partida en los selectores porque el juego las lee de ahí
        document.getElementById('selectorNivel').value = respuesta.nivel;
        document.getElementById('selectorTiempo').value = String(respuesta.duracion);
        document.getElementById('selectorAyuda').value = respuesta.ayuda;

        document.getElementById('configuracionJuego').classList.add('oculto');
        document.getElementById('contenedorJuego').classList.remove('oculto');

        mostrarNotificacionCliente("Partida #" + idJuego + " retomada. ¡A seguir jugando!", "success", 3000);
        cargarPalabrasDelRosco(respuesta);
    });
}

function cargarHistorialPartidas() {
    let parametros = "accion=obtenerUltimasPartidas";
    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', parametros, function (respuesta) {
        if (respuesta.exito) {
            let divHistorial = document.getElementById('listaUltimasPartidas');
            if (!divHistorial) return;

            let partidas = respuesta.partidas;
            if (!partidas || partidas.length === 0) {
                divHistorial.innerHTML = "<p class='historial-vacio'>No hay partidas registradas.</p>";
                return;
            }

            let motivos = { completo: 'Roscos completos', tiempo: 'Tiempo agotado', abandono: 'Abandono', vencida: 'Guardada y vencida (10 días)' };
            let html = "<ul class='historial-lista'>";
            partidas.forEach(p => {
                html += `<li class='historial-item'>
                    <strong>Partida #${p.id_juego}</strong> (${p.nivel.toUpperCase()})<br>
                    Fecha: ${p.fecha_inicio}<br>
                    Aciertos: ${respuesta.nombreJ1} ${p.aciertos_j1} - ${p.aciertos_j2} ${respuesta.nombreJ2}<br>
                    Fin: ${motivos[p.motivo_fin] || '-'}<br>
                    Ganador: <strong class='ganador-destacado'>${p.ganador}</strong>
                </li>`;
            });
            html += "</ul>";
            divHistorial.innerHTML = html;
        }
    });
}
