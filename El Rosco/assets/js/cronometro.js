function actualizarVisualCronometro() {
    let selectTiempo = document.getElementById('selectTiempo');
    let segundosConfigurados = selectTiempo ? parseInt(selectTiempo.value) : 120;

    let t1 = document.getElementById('tiempo-restante-j1');
    let t2 = document.getElementById('tiempo-restante-j2');

    if (segundosConfigurados === 0) {
        if (t1) t1.textContent = "Sin límite";
        if (t2) t2.textContent = "Sin límite";
        return;
    }

    if (t1) {
        t1.textContent = tiempoRestante[1] <= 0 ? "Agotado" : `${tiempoRestante[1]}s`;
        if (tiempoRestante[1] <= 30 && tiempoRestante[1] > 0) {
            t1.classList.add('tiempo-critico');
        } else {
            t1.classList.remove('tiempo-critico');
        }
    }

    if (t2) {
        t2.textContent = tiempoRestante[2] <= 0 ? "Agotado" : `${tiempoRestante[2]}s`;
        if (tiempoRestante[2] <= 30 && tiempoRestante[2] > 0) {
            t2.classList.add('tiempo-critico');
        } else {
            t2.classList.remove('tiempo-critico');
        }
    }
}

function iniciarCronometro() {
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
    }

    let selectTiempo = document.getElementById('selectTiempo');
    let segundosConfigurados = selectTiempo ? parseInt(selectTiempo.value) : 120;

    if (segundosConfigurados === 0) {
        let contenedorCrono = document.getElementById('contenedorCronometro');
        if (contenedorCrono) {
            contenedorCrono.classList.add('oculto');
        }
        intervaloCronometro = setInterval(() => {
            tiempoUsado[turnoJugador]++;
        }, 1000);
        return;
    }

    actualizarVisualCronometro();

    intervaloCronometro = setInterval(() => {
        if (tiempoRestante[turnoJugador] > 0) {
            tiempoRestante[turnoJugador]--;
            tiempoUsado[turnoJugador]++;
            actualizarVisualCronometro();

            if (tiempoRestante[turnoJugador] <= 0) {
                alert(`¡Se acabó el tiempo para el Jugador ${turnoJugador}!`);

                let indiceActivo = indiceLetraActual[turnoJugador];
                let botonActivo = document.querySelector(`.pos-${turnoJugador}-${indiceActivo}`);
                if (botonActivo) botonActivo.classList.remove('letra-activa');

                document.getElementById('zonaDefinicion').innerHTML = "";

                let otroJugador = (turnoJugador === 1) ? 2 : 1;
                let tiempoAgotadoOtro = (tiempoRestante[otroJugador] <= 0);
                let completoOtro = palabrasContestadas[otroJugador].every(val => val === true) || tiempoAgotadoOtro;

                if (!completoOtro) {
                    turnoJugador = otroJugador;
                    actualizarVisualTurno();
                    presentarDefinicionActiva();
                } else {
                    finalizarPartida(false);
                }
            }
        }
    }, 1000);
}
