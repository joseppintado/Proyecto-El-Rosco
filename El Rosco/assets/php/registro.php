<?php
require_once __DIR__ . '/Usuario.php';
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('America/Argentina/Buenos_Aires');

// Función auxiliar para responder y terminar el script
function responder($exito, $mensaje) {
    echo json_encode(['exito' => $exito, 'mensaje' => $mensaje]);
    exit;
}

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = trim($_POST['nombreUsuario'] ?? '');
    $contrasena = $_POST['contrasena'] ?? '';
    $correo = trim($_POST['correo'] ?? '');
    $fechaNacimiento = trim($_POST['fechaNacimiento'] ?? '');

    if ($nombre === '' || $contrasena === '' || $correo === '' || $fechaNacimiento === '') {
        responder(false, 'Todos los campos son obligatorios');
    }

    // Validamos el nombre de usuario: solo letras, números y guion bajo (3 a 20 caracteres)
    if (!preg_match('/^[A-Za-z0-9_]{3,20}$/', $nombre)) {
        responder(false, 'El nombre de usuario debe tener entre 3 y 20 caracteres: solo letras, números o guion bajo');
    }

    // Validamos formato de correo electrónico
    if (strlen($correo) > 100 || !preg_match('/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/', $correo)) {
        responder(false, 'El formato del correo electrónico no es válido');
    }

    // Validamos que la contraseña sea segura (mínimo 8 caracteres, 1 número, 1 mayúscula, 1 carácter especial)
    if (!preg_match('/^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/', $contrasena)) {
        responder(false, 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial (!@#$%^&*)');
    }

    // Validamos la fecha de nacimiento: que exista y no sea futura
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $fechaNacimiento, $partes)
        || !checkdate((int)$partes[2], (int)$partes[3], (int)$partes[1])
        || $fechaNacimiento > date('Y-m-d')) {
        responder(false, 'La fecha de nacimiento no es válida');
    }

    // Validamos que el nombre de usuario no esté registrado
    if (Usuario::existeNombreUsuario($nombre)) {
        responder(false, 'El nombre de usuario ya existe');
    }

    // si igual falla el insert (por ejemplo, otro usuario se registró con el mismo nombre al mismo tiempo) lo controla la UNIQUE de la base
    if(Usuario::registrarUsuario($nombre, $contrasena, $correo, $fechaNacimiento)){
        responder(true, 'Usuario registrado correctamente');
    }else{
        responder(false, 'No se pudo registrar el usuario. Intente nuevamente.');
    }
}
?>
