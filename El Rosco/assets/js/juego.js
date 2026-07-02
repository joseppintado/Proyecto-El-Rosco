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
const abecedario = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');


document.addEventListener('DOMContentLoaded', () => {
    // Enlazar botón de iniciar partida
    const btnIniciar = document.getElementById('btnIniciarPartida');
    if (btnIniciar) {
        btnIniciar.addEventListener('click', iniciarNuevaPartida);
    }

    const btnAbandonar = document.getElementById('btnAbandonar');
    if (btnAbandonar) {
        btnAbandonar.addEventListener('click', () => {
            if (confirm("¿Estás seguro de que deseas abandonar la partida?")) {
                abandonarPartida();
            }
        });
    }

    // Enlazar botones de estadísticas generales
    const btnEstadisticas = document.getElementById('btnVerEstadisticasGenerales');
    if (btnEstadisticas) {
        btnEstadisticas.addEventListener('click', () => {
            let seccionEstadisticas = document.getElementById('seccionEstadisticasGenerales');
            if (seccionEstadisticas && !seccionEstadisticas.classList.contains('oculto')) {
                return; // Si ya está visible, no hacer nada para evitar sobreescribir la pantalla previa
            }

            // Encontrar cuál es la pantalla visible antes de ocultar (solo si pantallaPreviaEstadisticas no está ya establecida)
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
                pantallaPreviaEstadisticas = null; // Restablecer para la próxima vez
            } else {
                document.getElementById('seccionUsuarios').classList.remove('oculto');
            }
        });
    }

    // Cargar el historial inicial
    cargarHistorialPartidas();

    const btnSalirConfiguracion = document.getElementById('btnSalirJuegoConfiguracion');
    if (btnSalirConfiguracion) {
        btnSalirConfiguracion.addEventListener('click', salirDelJuego);
    }
});

function salirDelJuego() {
    realizarPeticion('POST', 'El Rosco/assets/php/logout.php', '', function (respuesta) {
        if (respuesta.exito) {
            // Limpiar campos de login
            let usuarioInicioSesion = document.getElementById('usuarioInicioSesion');
            let claveInicioSesion = document.getElementById('claveInicioSesion');
            if (usuarioInicioSesion) usuarioInicioSesion.value = '';
            if (claveInicioSesion) claveInicioSesion.value = '';

            // Ocultar pantallas y mostrar login
            document.getElementById('contenedorJuego').classList.add('oculto');
            document.getElementById('configuracionJuego').classList.add('oculto');
            document.getElementById('seccionUsuarios').classList.remove('oculto');
            document.getElementById('zonaDefinicion').innerHTML = "";
        } else {
            alert("Error al salir del juego.");
        }
    });
}

function cargarPalabrasDelRosco() {
    let nivel = document.getElementById('selectNivel').value;
    console.log("Cargando palabras...");

    realizarPeticion('GET', 'El Rosco/assets/php/obtener_palabras.php', 'nivel=' + nivel + '&t=' + new Date().getTime(), function (palabras) {
        if (palabras && palabras.length > 0) {
            console.log("Palabras recibidas correctamente:", palabras);
            iniciarTablero(palabras);
        } else {
            console.error("No se recibieron palabras.");
            alert("Error al cargar las palabras del juego.");
        }
    });
}

function iniciarNuevaPartida() {
    let nivel = document.getElementById('selectNivel').value;
    let parametros = `accion=iniciarPartida&nivel=${nivel}`;

    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', parametros, function (respuesta) {
        if (respuesta.exito) {
            idPartidaActual = respuesta.idPartida;
            console.log("Partida iniciada, ID:", idPartidaActual);

            // Almacenar nombres de jugadores y turno inicial
            nombreJ1 = respuesta.nombreJ1 || "Jugador 1";
            nombreJ2 = respuesta.nombreJ2 || "Jugador 2";
            turnoJugador = respuesta.jugadorInicial || 1;

            // Actualizar etiquetas en la UI
            let etiquetaJ1 = document.getElementById('etiqueta-jugador1');
            let etiquetaJ2 = document.getElementById('etiqueta-jugador2');
            if (etiquetaJ1) etiquetaJ1.textContent = nombreJ1;
            if (etiquetaJ2) etiquetaJ2.textContent = nombreJ2;

            // Ocultamos la Pantalla 2 (Configuración) y mostramos Pantalla 3 (Juego Activo)
            document.getElementById('configuracionJuego').classList.add('oculto');
            document.getElementById('contenedorJuego').classList.remove('oculto');

            cargarPalabrasDelRosco();
        } else {
            alert("Error al iniciar la partida: " + respuesta.mensaje);
        }
    });
}

function iniciarTablero(listaPalabras) {
    palabrasJuego = listaPalabras;
    aciertos = { 1: 0, 2: 0 };
    errores = { 1: 0, 2: 0 };
    palabrasContestadas = {
        1: Array(27).fill(false),
        2: Array(27).fill(false)
    };
    indiceLetraActual = { 1: 0, 2: 0 };
    tiempoUsado = { 1: 0, 2: 0 };

    let selectTiempo = document.getElementById('selectTiempo');
    let segundosConfigurados = selectTiempo ? parseInt(selectTiempo.value) : 120;
    tiempoRestante = { 1: segundosConfigurados, 2: segundosConfigurados };

    // Mostrar el botón de abandonar
    let btnAbandonar = document.getElementById('btnAbandonar');
    if (btnAbandonar) {
        btnAbandonar.classList.remove('oculto');
    }

    // Cargar características en la Zona General
    let selectNivel = document.getElementById('selectNivel');
    let selectAyuda = document.getElementById('selectAyuda');

    let textoNivel = selectNivel ? selectNivel.value.toUpperCase() : "MEDIA";
    let textoTiempo = segundosConfigurados === 0 ? "Sin límite" : `${segundosConfigurados}s`;
    let textoAyuda = selectAyuda ? (selectAyuda.value === 'si' ? "Habilitada" : "Inhabilitada") : "Habilitada";

    document.getElementById('generalDificultad').textContent = textoNivel;
    document.getElementById('generalDuracion').textContent = textoTiempo;
    document.getElementById('generalAyuda').textContent = textoAyuda;

    // Cargar historial de partidas
    cargarHistorialPartidas();

    // Cargar jugador inicial definido en el servidor
    let nombreInicial = (turnoJugador === 1) ? nombreJ1 : nombreJ2;
    document.getElementById('generalJugadorInicial').textContent = nombreInicial;

    // Actualizar marcadores en el DOM
    document.getElementById('aciertos-j1').textContent = '0';
    document.getElementById('errores-j1').textContent = '0';
    document.getElementById('aciertos-j2').textContent = '0';
    document.getElementById('errores-j2').textContent = '0';

    let zonaJ1 = document.getElementById('zona-jugador1');
    let zonaJ2 = document.getElementById('zona-jugador2');
    zonaJ1.innerHTML = "";
    zonaJ2.innerHTML = "";

    // Renderizar rosco del Jugador 1
    abecedario.forEach((letra, index) => {
        let botonLetra = document.createElement('button');
        botonLetra.textContent = letra;
        botonLetra.classList.add("btn-letra");
        botonLetra.classList.add(`pos-1-${index}`);
        zonaJ1.appendChild(botonLetra);
    });

    // Renderizar rosco del Jugador 2
    abecedario.forEach((letra, index) => {
        let botonLetra = document.createElement('button');
        botonLetra.textContent = letra;
        botonLetra.classList.add("btn-letra");
        botonLetra.classList.add(`pos-2-${index}`);
        zonaJ2.appendChild(botonLetra);
    });

    actualizarVisualTurno();
    iniciarCronometro();
    presentarDefinicionActiva();
}

function presentarDefinicionActiva() {
    // Limpiar resaltado previo de cualquier letra activa
    document.querySelectorAll('.btn-letra').forEach(b => b.classList.remove('letra-activa'));

    // Si el jugador de este turno no tiene tiempo, no puede jugar
    let selectTiempo = document.getElementById('selectTiempo');
    let segundosConfigurados = selectTiempo ? parseInt(selectTiempo.value) : 120;

    let tiempoAgotadoJ1 = (segundosConfigurados > 0 && tiempoRestante[1] <= 0);
    let tiempoAgotadoJ2 = (segundosConfigurados > 0 && tiempoRestante[2] <= 0);

    let completoJ1 = palabrasContestadas[1].every(val => val === true) || tiempoAgotadoJ1;
    let completoJ2 = palabrasContestadas[2].every(val => val === true) || tiempoAgotadoJ2;

    if (completoJ1 && completoJ2) {
        finalizarPartida(false);
        return;
    }

    // Si el turno actual está finalizado, cambiar al otro
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

    // Verificar si el jugador del turno tiene letras pendientes, de lo contrario buscar en forma circular
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

    // Cargar la definición en la card
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

    // Cambiar de turno si el otro jugador tiene letras pendientes
    let siguienteJugador = (turnoJugador === 1) ? 2 : 1;

    let selectTiempo = document.getElementById('selectTiempo');
    let segundosConfigurados = selectTiempo ? parseInt(selectTiempo.value) : 120;
    let tiempoAgotadoSiguiente = (segundosConfigurados > 0 && tiempoRestante[siguienteJugador] <= 0);
    let siguienteFinalizado = palabrasContestadas[siguienteJugador].every(val => val === true) || tiempoAgotadoSiguiente;

    if (!siguienteFinalizado) {
        turnoJugador = siguienteJugador;
    }

    actualizarVisualTurno();
    presentarDefinicionActiva();
}

function actualizarVisualTurno() {
    let panelJ1 = document.getElementById('panel-jugador1');
    let panelJ2 = document.getElementById('panel-jugador2');
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

function mostrarDefinicion(palabra, indexRelativo, numJugador) {
    if (numJugador !== turnoJugador) {
        return;
    }

    let zonaDefinicion = document.getElementById('zonaDefinicion');

    let selectAyuda = document.getElementById('selectAyuda');
    let ayudaHabilitada = selectAyuda ? selectAyuda.value === 'si' : true;
    let ayudaHtml = ayudaHabilitada
        ? `<div class="ayuda-letras">Cantidad de letras: ${palabra.cantidad_letras}</div>`
        : ``;

    zonaDefinicion.innerHTML = `
        <div class="card-definicion">
            <h4 class="letra-indicador">Jugando letra: <span class="letra-resaltada">${abecedario[indexRelativo]}</span></h4>
            <p><strong>Definición:</strong> ${palabra.definicion}</p>
            ${ayudaHtml}
            <input type="text" id="inputRespuesta" placeholder="Tu respuesta..." autocomplete="off">
            <div class="definicion-acciones">
                <button id="btnEnviarRespuesta" class="btn-confirmar">Confirmar</button>
                <button id="btnCederTurno" class="btn-ceder">Ceder Turno</button>
            </div>
        </div>
    `;

    const campoRespuesta = document.getElementById('inputRespuesta');
    campoRespuesta.focus();

    // Confirmar respuesta con botón
    document.getElementById('btnEnviarRespuesta').onclick = function () {
        let respuesta = campoRespuesta.value;
        enviarRespuesta(idPartidaActual, palabra.id_palabra, respuesta, indexRelativo, numJugador);
    };

    // Ceder turno con botón
    document.getElementById('btnCederTurno').onclick = function () {
        cederTurno();
    };

    // Confirmar respuesta con tecla Enter
    campoRespuesta.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            let respuesta = campoRespuesta.value;
            enviarRespuesta(idPartidaActual, palabra.id_palabra, respuesta, indexRelativo, numJugador);
        }
    });
}

function enviarRespuesta(idJuego, idPalabra, respuesta, indexRelativo, numJugador) {
    let parametros = `accion=verificar&id_juego=${idJuego}&id_palabra=${idPalabra}&respuesta_usuario=${encodeURIComponent(respuesta)}&turno_activo=${numJugador}`;

    realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', parametros, function (resultado) {
        if (resultado.exito) {
            let datos = resultado.datos;
            palabrasContestadas[numJugador][indexRelativo] = true;

            let boton = document.querySelector(`.pos-${numJugador}-${indexRelativo}`);
            if (boton) {
                boton.classList.remove('letra-activa');
            }

            let selectTiempo = document.getElementById('selectTiempo');
            let segundosConfigurados = selectTiempo ? parseInt(selectTiempo.value) : 120;

            if (datos.es_correcta) {
                if (boton) boton.classList.add("acierto");
                aciertos[numJugador]++;
                document.getElementById(`aciertos-j${numJugador}`).textContent = aciertos[numJugador];

                alert("Letra " + abecedario[indexRelativo].toUpperCase() + ": Correcto");

                // Mantiene el turno, avanza al siguiente término del mismo jugador
                indiceLetraActual[numJugador] = (indiceLetraActual[numJugador] + 1) % 27;
            } else {
                if (boton) boton.classList.add("error");
                errores[numJugador]++;
                document.getElementById(`errores-j${numJugador}`).textContent = errores[numJugador];

                alert("Letra " + abecedario[indexRelativo].toUpperCase() + ": Incorrecto. La palabra correcta era: " + datos.palabra_correcta);

                // Pierde el turno y avanza de término
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
            alert("Error: " + resultado.mensaje);
        }
    });
}

function abandonarPartida() {
    let abandona = turnoJugador;
    let ganador = (abandona === 1) ? 2 : 1;
    finalizarPartida(false, ganador);
}

function finalizarPartida(porTiempo, ganadorForzado = null) {
    clearInterval(intervaloCronometro);

    // Ocultar el botón de abandonar al finalizar
    let btnAbandonar = document.getElementById('btnAbandonar');
    if (btnAbandonar) {
        btnAbandonar.classList.add('oculto');
    }

    document.querySelectorAll('.btn-letra').forEach(b => {
        b.onclick = null;
    });

    let ganador = null;
    let mensajeFinal = "";

    if (ganadorForzado !== null) {
        ganador = ganadorForzado;
        let nombrePerdedor = (ganador === 1) ? nombreJ2 : nombreJ1;
        let nombreGanador = (ganador === 1) ? nombreJ1 : nombreJ2;
        mensajeFinal = `¡Fin de la partida! ${nombrePerdedor} ha abandonado. Ha ganado ${nombreGanador}.`;
    } else {
        if (aciertos[1] > aciertos[2]) {
            ganador = 1;
            mensajeFinal = `¡Fin de la partida! Ha ganado ${nombreJ1} con ${aciertos[1]} aciertos.`;
        } else if (aciertos[2] > aciertos[1]) {
            ganador = 2;
            mensajeFinal = `¡Fin de la partida! Ha ganado ${nombreJ2} con ${aciertos[2]} aciertos.`;
        } else {
            // En caso de empate en aciertos, gana el que usó menos tiempo
            if (tiempoUsado[1] < tiempoUsado[2]) {
                ganador = 1;
                mensajeFinal = `¡Fin de la partida! Empate en aciertos (${aciertos[1]}), pero gana ${nombreJ1} por usar menos tiempo (${tiempoUsado[1]}s vs ${tiempoUsado[2]}s).`;
            } else if (tiempoUsado[2] < tiempoUsado[1]) {
                ganador = 2;
                mensajeFinal = `¡Fin de la partida! Empate en aciertos (${aciertos[2]}), pero gana ${nombreJ2} por usar menos tiempo (${tiempoUsado[2]}s vs ${tiempoUsado[1]}s).`;
            } else {
                ganador = 1; // Por defecto Jugador 1 en empate absoluto
                mensajeFinal = `¡Fin de la partida! Empate absoluto en aciertos (${aciertos[1]}) y tiempo (${tiempoUsado[1]}s).`;
            }
        }
    }

    if (porTiempo) {
        mensajeFinal = "¡Tiempo agotado! " + mensajeFinal;
    }

    alert(mensajeFinal);

    // Registrar en BD el ganador
    if (ganador === 1 || ganador === 2) {
        let parametros = `accion=registrarGanador&id_juego=${idPartidaActual}&id_ganador_jugador=${ganador}&tiempo_usado=${tiempoUsado[ganador]}`;
        realizarPeticion('POST', 'El Rosco/assets/php/controladorJuego.php', parametros, function (respuesta) {
            if (respuesta.exito) {
                console.log("Ganador registrado correctamente");
                cargarHistorialPartidas();
            } else {
                console.error("Error al registrar ganador:", respuesta.mensaje);
            }
        });
    } else {
        cargarHistorialPartidas();
    }

    document.getElementById('zonaDefinicion').innerHTML = `
        <div class="card-definicion card-finalizada">
            <h3>Partida Finalizada</h3>
            <p>${mensajeFinal}</p>
            <div class="definicion-acciones">
                <button id="btnVolverAConfiguracion" class="btn-ayuda btn-volver-config">Jugar otra partida</button>
                <button id="btnSalirJuegoFin" class="btn-abandonar btn-cerrar-fin">Salir del juego</button>
            </div>
        </div>
    `;

    document.getElementById('btnVolverAConfiguracion').onclick = function () {
        document.getElementById('contenedorJuego').classList.add('oculto');
        document.getElementById('configuracionJuego').classList.remove('oculto');
        document.getElementById('zonaDefinicion').innerHTML = "";
    };

    document.getElementById('btnSalirJuegoFin').onclick = salirDelJuego;

    document.getElementById('panel-jugador1').classList.remove('jugador-activo');
    document.getElementById('panel-jugador2').classList.remove('jugador-activo');
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

            let html = "<ul class='historial-lista'>";
            partidas.forEach(p => {
                let ganadorText = p.ganador ? `<strong class='ganador-destacado'>${p.ganador}</strong>` : "<span class='ganador-local'>Ninguno (Local)</span>";
                html += `<li class='historial-item'>
                    <strong>Partida #${p.id_juego}</strong><br>
                    Fecha: ${p.fecha_inicio}<br>
                    Ganador: ${ganadorText}
                </li>`;
            });
            html += "</ul>";
            divHistorial.innerHTML = html;
        }
    });
}
