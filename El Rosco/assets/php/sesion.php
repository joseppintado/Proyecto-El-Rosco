<?php
// manejo de la sesión con vencimiento por inactividad y por tiempo máximo

// cargamos Usuario antes de session_start porque en la sesión guardamos objetos Usuario
require_once __DIR__ . '/Usuario.php';

define('TIEMPO_MAX_INACTIVIDAD', 1800); // 30 minutos sin actividad
define('TIEMPO_MAX_SESION', 14400);     // 4 horas como máximo desde que inicia sesión el jugador 1

function abrirSesion() {
    session_start();
    $ahora = time();

    $vencioInactividad = isset($_SESSION['ultima_actividad'])
        && ($ahora - $_SESSION['ultima_actividad']) > TIEMPO_MAX_INACTIVIDAD;

    $vencioAbsoluto = isset($_SESSION['inicio_sesion'])
        && ($ahora - $_SESSION['inicio_sesion']) > TIEMPO_MAX_SESION;

    if ($vencioInactividad || $vencioAbsoluto) {
        cerrarSesion();
        session_start(); // arrancamos una sesión nueva
    }

    $_SESSION['ultima_actividad'] = $ahora;
}

function cerrarSesion() {
    // limpiamos el arreglo y destruimos la sesión
    $_SESSION = [];
    session_destroy();
}
?>
