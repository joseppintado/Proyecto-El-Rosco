/**
 * Función genérica para realizar peticiones AJAX
 * @param {string} metodo 'GET' o 'POST'
 * @param {string} url La ruta al archivo .php
 * @param {string} parametros Los datos a enviar (ej: "nivel=media")
 * @param {function} funcionCallback Función que procesará la respuesta
 */

function realizarPeticion(metodo, url, parametros, funcionCallback) {
    let peticion = new XMLHttpRequest();
    peticion.onreadystatechange = function () {
        if (peticion.readyState === 4 && peticion.status === 200) {
            //Convertimos el JSON de respuesta en objeto JS
            let respuesta = JSON.parse(peticion.responseText);
            funcionCallback(respuesta);
        }
    };

    if (metodo == 'POST') {
        peticion.open("POST", url, true);
        peticion.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        peticion.send(parametros);
    } else if (metodo == 'GET') {
        peticion.open("GET", url + "?" + parametros, true)
        peticion.send(null);
    }
}